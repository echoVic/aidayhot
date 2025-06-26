-- 查看实际的文章分类分布
SELECT category, COUNT(*) as count 
FROM articles 
WHERE category IS NOT NULL 
GROUP BY category 
ORDER BY count DESC;
