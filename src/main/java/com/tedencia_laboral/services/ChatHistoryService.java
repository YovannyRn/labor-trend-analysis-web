package com.tedencia_laboral.services;

import com.tedencia_laboral.models.User;
import com.tedencia_laboral.models.UserQuery;
import com.tedencia_laboral.repositories.UserQueryRepository;
import com.tedencia_laboral.repositories.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ChatHistoryService {
    
    private final UserQueryRepository userQueryRepository;
    private final UserRepository userRepository;

    public ChatHistoryService(UserQueryRepository userQueryRepository, UserRepository userRepository) {
        this.userQueryRepository = userQueryRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Guarda una nueva query del usuario
     * ESTE MÉTODO SE LLAMARÁ DESDE N8N
     */
    public UserQuery saveUserQuery(Long userId, String queryText, String queryType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + userId));
        
        UserQuery userQuery = new UserQuery(user, queryText, null, queryType);
        return userQueryRepository.save(userQuery);
    }
    
    /**
     * Actualiza la respuesta de una query existente
     * ESTE MÉTODO SE LLAMARÁ DESDE N8N DESPUÉS DE PROCESAR
     */
    public UserQuery updateQueryResponse(Long queryId, String responseText, 
                                        String responseData, String sources) {
        Optional<UserQuery> queryOpt = userQueryRepository.findById(queryId);
        if (queryOpt.isPresent()) {
            UserQuery query = queryOpt.get();
            query.updateResponse(responseText, responseData, sources);
            return userQueryRepository.save(query);
        }
        throw new RuntimeException("Query no encontrada: " + queryId);
    }
    
    /**
     * Obtiene el historial paginado de un usuario
     * PARA EL FRONTEND ANGULAR
     */
    public Page<UserQuery> getUserChatHistory(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return userQueryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
    
    /**
     * Busca en el historial por texto
     * PARA LA FUNCIONALIDAD DE BÚSQUEDA
     */
    public List<UserQuery> searchUserChatHistory(Long userId, String searchText) {
        return userQueryRepository.findByUserIdAndTextContaining(userId, searchText);
    }
    
    /**
     * Obtiene historial filtrado por tipo
     * PARA FILTRAR POR chat/graph/sources
     */
    public List<UserQuery> getUserChatHistoryByType(Long userId, String queryType) {
        return userQueryRepository.findByUserIdAndQueryTypeOrderByCreatedAtDesc(userId, queryType);
    }
    
    /**
     * Obtiene conversaciones recientes (últimas 24h)
     * PARA DASHBOARD O VISTA RÁPIDA
     */
    public List<UserQuery> getRecentUserQueries(Long userId) {
        LocalDateTime since = LocalDateTime.now().minusDays(1);
        return userQueryRepository.findRecentByUserId(userId, since);
    }
    
    /**
     * Elimina una query específica
     * PARA GESTIÓN DE HISTORIAL
     */
    public boolean deleteUserQuery(Long userId, Long queryId) {
        Optional<UserQuery> queryOpt = userQueryRepository.findById(queryId);
        if (queryOpt.isPresent() && queryOpt.get().getUser().getId().equals(userId)) {
            userQueryRepository.deleteById(queryId);
            return true;
        }
        return false;
    }
    
    /**
     * Limpia historial antiguo (más de 30 días)
     * PARA MANTENIMIENTO AUTOMÁTICO
     */
    public void cleanupOldQueries(Long userId) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        userQueryRepository.deleteByUserIdAndCreatedAtBefore(userId, cutoff);
    }
    
    /**
     * Obtiene estadísticas de uso
     * PARA ANALYTICS
     */
    public ChatHistoryStats getUserChatStats(Long userId) {
        long totalQueries = userQueryRepository.countByUserId(userId);
        LocalDateTime lastWeek = LocalDateTime.now().minusDays(7);
        List<UserQuery> recentQueries = userQueryRepository.findRecentByUserId(userId, lastWeek);
        
        return new ChatHistoryStats(totalQueries, recentQueries.size());
    }
    
    // Clase interna para estadísticas
    public static class ChatHistoryStats {
        private final long totalQueries;
        private final int recentQueries;
        
        public ChatHistoryStats(long totalQueries, int recentQueries) {
            this.totalQueries = totalQueries;
            this.recentQueries = recentQueries;
        }
        
        public long getTotalQueries() { 
            return totalQueries; 
        }
        
        public int getRecentQueries() { 
            return recentQueries; 
        }
    }
}
