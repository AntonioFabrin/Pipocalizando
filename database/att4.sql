SELECT
  ms.id AS session_id,
  ms.movie_id,
  m.title,
  ms.session_date,
  ms.session_time,
  ms.is_active,
  m.is_active AS movie_active
FROM movie_sessions ms
JOIN movies m ON m.id = ms.movie_id
ORDER BY ms.id;
