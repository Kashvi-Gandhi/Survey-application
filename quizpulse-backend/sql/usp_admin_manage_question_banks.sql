CREATE OR ALTER PROCEDURE quiz.usp_admin_manage_question_banks
    @p_action NVARCHAR(10),
    @p_bank_id UNIQUEIDENTIFIER = NULL,
    @p_title NVARCHAR(255) = NULL,
    @p_category NVARCHAR(100) = NULL,
    @p_description NVARCHAR(MAX) = NULL,
    @p_questions_json NVARCHAR(MAX) = NULL,
    @p_created_by UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @p_action = UPPER(LTRIM(RTRIM(@p_action)));

    IF @p_action NOT IN ('READ', 'CREATE', 'UPDATE', 'DELETE')
        THROW 50020, 'p_action must be READ, CREATE, UPDATE, or DELETE.', 1;

    IF @p_action IN ('CREATE', 'UPDATE')
       AND (NULLIF(LTRIM(RTRIM(@p_title)), '') IS NULL
            OR (@p_questions_json IS NOT NULL AND ISJSON(@p_questions_json) <> 1))
        THROW 50020, 'A title and a valid questions JSON array are required.', 1;

    IF @p_action = 'READ'
    BEGIN
        SELECT qb.id, qb.title, qb.category, qb.description, qb.created_at, qb.is_global,
               (SELECT q.id, q.question_text, q.question_type, q.options, q.order_index
                FROM quiz.questions q WHERE q.bank_id = qb.id
                ORDER BY q.order_index, q.id FOR JSON PATH) AS questions_json
        FROM quiz.question_banks qb
        WHERE qb.is_global = 1
        ORDER BY qb.category, qb.title;
        RETURN;
    END

    BEGIN TRANSACTION;
    IF @p_action = 'CREATE'
    BEGIN
        SET @p_bank_id = NEWID();
        INSERT INTO quiz.question_banks (id, title, category, description, created_by, is_global)
        VALUES (@p_bank_id, @p_title, @p_category, @p_description, @p_created_by, 1);
    END
    ELSE IF @p_action = 'UPDATE'
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM quiz.question_banks WHERE id = @p_bank_id AND is_global = 1)
            THROW 50021, 'Master question bank not found.', 1;
        UPDATE quiz.question_banks
        SET title = @p_title, category = @p_category, description = @p_description
        WHERE id = @p_bank_id;
        IF @p_questions_json IS NOT NULL DELETE FROM quiz.questions WHERE bank_id = @p_bank_id;
    END
    ELSE IF @p_action = 'DELETE'
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM quiz.question_banks WHERE id = @p_bank_id AND is_global = 1)
            THROW 50022, 'Master question bank not found.', 1;
        DELETE FROM quiz.questions WHERE bank_id = @p_bank_id;
        DELETE FROM quiz.question_banks WHERE id = @p_bank_id;
        COMMIT TRANSACTION;
        SELECT @p_bank_id AS id;
        RETURN;
    END

    IF @p_questions_json IS NOT NULL
    BEGIN
        INSERT INTO quiz.questions (bank_id, question_text, question_type, options, points, is_required, order_index, correct_answer)
        SELECT @p_bank_id, src.question_text, src.question_type, src.options,
               COALESCE(src.points, 1), COALESCE(src.is_required, 1), COALESCE(src.order_index, src.row_number), src.correct_answer
        FROM OPENJSON(@p_questions_json)
        WITH (
            question_text NVARCHAR(MAX) '$.question_text', question_type NVARCHAR(50) '$.question_type',
            options NVARCHAR(MAX) '$.options' AS JSON, points INT '$.points', is_required BIT '$.is_required',
            order_index INT '$.order_index', correct_answer NVARCHAR(MAX) '$.correct_answer' AS JSON,
            row_number INT '$.row_number'
        ) src;
    END
    COMMIT TRANSACTION;

    SELECT qb.id, qb.title, qb.category, qb.description, qb.created_at, qb.is_global,
           (SELECT q.id, q.question_text, q.question_type, q.options, q.order_index
            FROM quiz.questions q WHERE q.bank_id = qb.id ORDER BY q.order_index, q.id FOR JSON PATH) AS questions_json
    FROM quiz.question_banks qb WHERE qb.id = @p_bank_id;
END
GO
