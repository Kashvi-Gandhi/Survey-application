IF COL_LENGTH('quiz.question_banks', 'is_global') IS NULL
BEGIN
    ALTER TABLE quiz.question_banks
    ADD is_global BIT NOT NULL
        CONSTRAINT DF_quiz_question_banks_is_global DEFAULT (0);
END
GO

IF COL_LENGTH('quiz.surveys', 'status') IS NULL
BEGIN
    ALTER TABLE quiz.surveys
    ADD status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_quiz_surveys_status DEFAULT ('DRAFT');

    EXEC sys.sp_executesql N'
        UPDATE quiz.surveys
        SET status = CASE WHEN is_published = 1 THEN ''ACTIVE'' ELSE ''DRAFT'' END;
    ';
END
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
