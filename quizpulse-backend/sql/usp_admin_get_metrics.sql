CREATE OR ALTER PROCEDURE quiz.usp_admin_get_metrics
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @active_surveys INT = 0;

    IF COL_LENGTH('quiz.surveys', 'status') IS NOT NULL
        EXEC sys.sp_executesql
            N'SELECT @active = COUNT(*) FROM quiz.surveys WHERE UPPER(status) IN (''ACTIVE'', ''PUBLISHED'');',
            N'@active INT OUTPUT',
            @active = @active_surveys OUTPUT;
    ELSE IF COL_LENGTH('quiz.surveys', 'is_published') IS NOT NULL
        EXEC sys.sp_executesql
            N'SELECT @active = COUNT(*) FROM quiz.surveys WHERE is_published = 1;',
            N'@active INT OUTPUT',
            @active = @active_surveys OUTPUT;

    SELECT
        (SELECT COUNT(*) FROM quiz.profiles p INNER JOIN quiz.role_master r ON r.id = p.role_id WHERE LOWER(r.role_name) = 'surveyor') AS total_surveyors,
        (SELECT COUNT(*) FROM quiz.surveys) AS total_surveys,
        @active_surveys AS active_surveys,
        (SELECT COUNT(*) FROM quiz.responses) AS total_submissions,
        (SELECT COUNT(*) FROM quiz.question_banks) AS total_question_banks;
END
GO
