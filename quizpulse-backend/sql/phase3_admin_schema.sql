IF COL_LENGTH('quiz.question_banks', 'is_global') IS NULL
BEGIN
    ALTER TABLE quiz.question_banks
    ADD is_global BIT NOT NULL
        CONSTRAINT DF_quiz_question_banks_is_global DEFAULT (0);
END
GO

IF COL_LENGTH('quiz.question_banks', 'category') IS NULL
BEGIN
    ALTER TABLE quiz.question_banks ADD category NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('quiz.surveys', 'status') IS NULL
BEGIN
    ALTER TABLE quiz.surveys
    ADD status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_quiz_surveys_status DEFAULT ('ACTIVE');

    EXEC sys.sp_executesql N'
        UPDATE quiz.surveys
        SET status = CASE WHEN is_published = 1 THEN ''ACTIVE'' ELSE ''DRAFT'' END;
    ';
END
GO

-- Existing installations already have the Phase 3 default.  Replace it so new
-- assessments are ACTIVE without altering historical survey lifecycle states.
DECLARE @default_constraint SYSNAME;
SELECT @default_constraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.default_object_id = dc.object_id
WHERE dc.parent_object_id = OBJECT_ID('quiz.surveys') AND c.name = 'status';

IF @default_constraint IS NOT NULL
    EXEC('ALTER TABLE quiz.surveys DROP CONSTRAINT ' + QUOTENAME(@default_constraint));
ALTER TABLE quiz.surveys
ADD CONSTRAINT DF_quiz_surveys_status DEFAULT ('ACTIVE') FOR status;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_quiz_surveys_status'
      AND parent_object_id = OBJECT_ID('quiz.surveys')
)
BEGIN
    ALTER TABLE quiz.surveys
    ADD CONSTRAINT CK_quiz_surveys_status
        CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'));
END
GO
