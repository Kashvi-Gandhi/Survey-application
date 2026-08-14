CREATE OR ALTER PROCEDURE quiz.usp_update_survey
    @p_survey_id UNIQUEIDENTIFIER,
    @p_title NVARCHAR(255),
    @p_description NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM quiz.responses WHERE survey_id = @p_survey_id)
            THROW 50002, 'Cannot edit a survey that already has responses.', 1;

        UPDATE quiz.surveys
        SET title = @p_title,
            description = @p_description
        WHERE id = @p_survey_id;

        IF @@ROWCOUNT = 0
            THROW 50003, 'Survey not found.', 1;

        COMMIT TRANSACTION;
        SELECT id, title, description FROM quiz.surveys WHERE id = @p_survey_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
