CREATE OR ALTER PROCEDURE quiz.usp_update_survey
    @p_survey_id UNIQUEIDENTIFIER,
    @p_title NVARCHAR(255),
    @p_description NVARCHAR(MAX) = NULL,
    @p_questions_json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE quiz.surveys
        SET title = @p_title,
            description = @p_description
        WHERE id = @p_survey_id;

        IF @@ROWCOUNT = 0
            THROW 50003, 'Survey not found.', 1;

        -- A NULL payload means metadata-only update.  An array (including [])
        -- is a deliberate request to synchronize the question structure.
        IF @p_questions_json IS NOT NULL
        BEGIN
            IF ISJSON(@p_questions_json) <> 1 OR LEFT(LTRIM(@p_questions_json), 1) <> '['
                THROW 50001, 'p_questions_json must be a JSON array.', 1;

            IF EXISTS (SELECT 1 FROM quiz.responses WHERE survey_id = @p_survey_id)
                THROW 50002, 'Cannot modify questions on a survey with existing responses.', 1;

            IF EXISTS (
                SELECT 1
                FROM OPENJSON(@p_questions_json)
                WITH (
                    question_text NVARCHAR(MAX) '$.question_text',
                    question_type NVARCHAR(50) '$.question_type'
                ) source
                WHERE NULLIF(LTRIM(RTRIM(source.question_text)), '') IS NULL
                   OR NULLIF(LTRIM(RTRIM(source.question_type)), '') IS NULL
            )
                THROW 50001, 'Every question requires question_text and question_type.', 1;

            -- No responses can reference these rows due to the guard above.
            -- Deleting and recreating inside this transaction prevents stale
            -- options/questions and guarantees the saved order matches the UI.
            DELETE FROM quiz.questions WHERE survey_id = @p_survey_id;

            INSERT INTO quiz.questions (
                survey_id, question_text, question_type, options,
                points, is_required, order_index, correct_answer
            )
            SELECT
                @p_survey_id,
                source.question_text,
                source.question_type,
                source.options,
                COALESCE(source.points, 1),
                COALESCE(source.is_required, 1),
                source.order_index,
                source.correct_answer
            FROM OPENJSON(@p_questions_json)
            WITH (
                question_text NVARCHAR(MAX) '$.question_text',
                question_type NVARCHAR(50) '$.question_type',
                options NVARCHAR(MAX) '$.options' AS JSON,
                points INT '$.points',
                is_required BIT '$.is_required',
                order_index INT '$.order_index',
                correct_answer NVARCHAR(MAX) '$.correct_answer' AS JSON
            ) source;
        END

        COMMIT TRANSACTION;
        SELECT id, title, description FROM quiz.surveys WHERE id = @p_survey_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
