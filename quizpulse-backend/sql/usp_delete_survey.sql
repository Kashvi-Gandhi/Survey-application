CREATE OR ALTER PROCEDURE quiz.usp_delete_survey
    @p_survey_id UNIQUEIDENTIFIER,
    @p_created_by NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM quiz.surveys
            WHERE id = @p_survey_id
              AND CONVERT(NVARCHAR(100), created_by) = @p_created_by
        )
            THROW 50004, 'Survey not found or you do not have permission to delete it.', 1;

        DELETE FROM quiz.responses WHERE survey_id = @p_survey_id;
        DELETE FROM quiz.questions WHERE survey_id = @p_survey_id;
        DELETE FROM quiz.surveys WHERE id = @p_survey_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
