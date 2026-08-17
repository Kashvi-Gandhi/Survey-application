IF COL_LENGTH('quiz.question_banks', 'is_global') IS NULL
BEGIN
    ALTER TABLE quiz.question_banks
    ADD is_global BIT NOT NULL
        CONSTRAINT DF_quiz_question_banks_is_global DEFAULT (0);
END
GO

CREATE OR ALTER PROCEDURE quiz.usp_createquestionbank
    @name NVARCHAR(255), @description NVARCHAR(MAX) = NULL,
    @created_by UNIQUEIDENTIFIER, @p_role NVARCHAR(50) = 'surveyor'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @bank TABLE (id UNIQUEIDENTIFIER, title NVARCHAR(255), description NVARCHAR(MAX), is_global BIT);
    INSERT INTO quiz.question_banks (title, description, created_by, is_global)
    OUTPUT inserted.id, inserted.title, inserted.description, inserted.is_global INTO @bank
    VALUES (@name, @description, @created_by, CASE WHEN LOWER(@p_role) = 'admin' THEN 1 ELSE 0 END);
    SELECT * FROM @bank;
END
GO

CREATE OR ALTER PROCEDURE quiz.usp_updatequestionbank
    @p_bank_id UNIQUEIDENTIFIER, @p_title NVARCHAR(255), @p_description NVARCHAR(MAX) = NULL,
    @p_user_id UNIQUEIDENTIFIER, @p_role NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM quiz.question_banks WHERE id = @p_bank_id)
    BEGIN SELECT CAST(NULL AS UNIQUEIDENTIFIER) AS id; RETURN; END;
    IF LOWER(@p_role) <> 'admin' AND NOT EXISTS (SELECT 1 FROM quiz.question_banks WHERE id = @p_bank_id AND created_by = @p_user_id)
        THROW 50031, 'You can only edit question banks you created.', 1;
    UPDATE quiz.question_banks SET title = @p_title, description = @p_description WHERE id = @p_bank_id;
    SELECT id, title, description, is_global FROM quiz.question_banks WHERE id = @p_bank_id;
END
GO

CREATE OR ALTER PROCEDURE quiz.usp_deletequestionbank
    @p_bank_id UNIQUEIDENTIFIER, @p_user_id UNIQUEIDENTIFIER, @p_role NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM quiz.question_banks WHERE id = @p_bank_id)
    BEGIN SELECT CAST(NULL AS UNIQUEIDENTIFIER) AS id; RETURN; END;
    IF LOWER(@p_role) <> 'admin' AND NOT EXISTS (SELECT 1 FROM quiz.question_banks WHERE id = @p_bank_id AND created_by = @p_user_id)
        THROW 50031, 'You can only delete question banks you created.', 1;
    DELETE FROM quiz.questions WHERE bank_id = @p_bank_id;
    DELETE FROM quiz.question_banks WHERE id = @p_bank_id;
    SELECT @p_bank_id AS id;
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
