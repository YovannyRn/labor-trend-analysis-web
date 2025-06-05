package com.tedencia_laboral.repositories;

import com.tedencia_laboral.models.UserQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserQueryRepository extends JpaRepository<UserQuery, Long> {
    
    // Obtener historial de usuario con paginación
    Page<UserQuery> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // Buscar en historial por texto
    @Query("SELECT uq FROM UserQuery uq WHERE uq.user.id = :userId " +
           "AND (uq.queryText LIKE %:searchText% OR uq.responseText LIKE %:searchText%) " +
           "ORDER BY uq.createdAt DESC")
    List<UserQuery> findByUserIdAndTextContaining(@Param("userId") Long userId, 
                                                 @Param("searchText") String searchText);
    
    // Obtener por tipo de query
    List<UserQuery> findByUserIdAndQueryTypeOrderByCreatedAtDesc(Long userId, String queryType);
    
    // Obtener conversaciones recientes
    @Query("SELECT uq FROM UserQuery uq WHERE uq.user.id = :userId " +
           "AND uq.createdAt >= :since ORDER BY uq.createdAt DESC")
    List<UserQuery> findRecentByUserId(@Param("userId") Long userId, 
                                      @Param("since") LocalDateTime since);
    
    // Contar total de queries por usuario
    long countByUserId(Long userId);
    
    // Eliminar queries antiguas (para limpieza)
    void deleteByUserIdAndCreatedAtBefore(Long userId, LocalDateTime cutoffDate);
    
    // Encontrar todas las queries de un usuario
    List<UserQuery> findByUserIdOrderByCreatedAtDesc(Long userId);
}
