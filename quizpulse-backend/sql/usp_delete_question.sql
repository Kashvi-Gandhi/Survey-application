CREATE OR ALTER PROCEDURE quiz.usp_delete_question
    @p_question_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    -- Delete dependent rows explicitly for databases without cascading FKs.
    DELETE FROM quiz.responses WHERE question_id = @p_question_id;
    DELETE FROM quiz.questions WHERE id = @p_question_id;

    COMMIT TRANSACTION;
END
GO
