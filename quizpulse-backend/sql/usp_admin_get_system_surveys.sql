CREATE OR ALTER PROCEDURE quiz.usp_admin_get_system_surveys
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.id,
        s.title,
        s.description,
        s.status,
        s.is_published,
        s.created_at,
        s.updated_at,
        owner.id AS owner_id,
        owner.full_name AS owner_name,
        owner.email AS owner_email,
        COUNT(response.id) AS response_count
    FROM quiz.surveys s
    LEFT JOIN quiz.profiles owner ON owner.id = s.created_by
    LEFT JOIN quiz.responses response ON response.survey_id = s.id
    GROUP BY
        s.id, s.title, s.description, s.status, s.is_published, s.created_at, s.updated_at,
        owner.id, owner.full_name, owner.email
    ORDER BY s.created_at DESC;
END
GO
