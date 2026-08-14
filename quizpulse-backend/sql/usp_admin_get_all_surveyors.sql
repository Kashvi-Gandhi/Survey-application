CREATE OR ALTER PROCEDURE quiz.usp_admin_get_all_surveyors
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.id,
        p.full_name AS name,
        p.email,
        p.created_at,
        p.is_active,
        COALESCE(survey_counts.surveys_created, 0) AS surveys_created,
        COALESCE(response_counts.responses_received, 0) AS responses_received
    FROM quiz.profiles p
    INNER JOIN quiz.role_master r ON r.id = p.role_id
    OUTER APPLY (
        SELECT COUNT(*) AS surveys_created
        FROM quiz.surveys s
        WHERE s.created_by = p.id
    ) survey_counts
    OUTER APPLY (
        SELECT COUNT(*) AS responses_received
        FROM quiz.responses response
        INNER JOIN quiz.surveys s ON s.id = response.survey_id
        WHERE s.created_by = p.id
    ) response_counts
    WHERE LOWER(r.role_name) = 'surveyor'
    ORDER BY p.created_at DESC;
END
GO
