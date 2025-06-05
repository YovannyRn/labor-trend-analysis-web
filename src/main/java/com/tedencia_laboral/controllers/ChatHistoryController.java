package com.tedencia_laboral.controllers;

import com.tedencia_laboral.dtos.auth.CreateChatRequest;
import com.tedencia_laboral.dtos.auth.UpdateResponseRequest;
import com.tedencia_laboral.models.UserQuery;
import com.tedencia_laboral.security.JwtUtil;
import com.tedencia_laboral.services.ChatHistoryService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat-history")
@CrossOrigin("*")
public class ChatHistoryController {
    
    private final ChatHistoryService chatHistoryService;
    private final JwtUtil jwtUtil;

    public ChatHistoryController(ChatHistoryService chatHistoryService, JwtUtil jwtUtil) {
        this.chatHistoryService = chatHistoryService;
        this.jwtUtil = jwtUtil;
    }
      /**
     * GET /api/chat-history - Obtener historial paginado
     * USO: Llamado desde Angular para cargar historial en LayoutSearchComponent
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getChatHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Long userId = getUserIdFromToken(authHeader);
        Page<UserQuery> history = chatHistoryService.getUserChatHistory(userId, page, size);
        
        // Convertir a formato esperado por Angular
        Map<String, Object> response = Map.of(
            "content", history.getContent(),
            "totalElements", history.getTotalElements(),
            "totalPages", history.getTotalPages(),
            "size", history.getSize(),
            "number", history.getNumber()
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * GET /api/chat-history/search - Buscar en historial
     * USO: Función de búsqueda en el frontend
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserQuery>> searchChatHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String q) {
        
        Long userId = getUserIdFromToken(authHeader);
        List<UserQuery> results = chatHistoryService.searchUserChatHistory(userId, q);
        return ResponseEntity.ok(results);
    }
    
    /**
     * GET /api/chat-history/type/{type} - Filtrar por tipo
     * USO: Filtrar chat/graph/sources en el frontend
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<UserQuery>> getChatHistoryByType(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String type) {
        
        Long userId = getUserIdFromToken(authHeader);
        List<UserQuery> history = chatHistoryService.getUserChatHistoryByType(userId, type);
        return ResponseEntity.ok(history);
    }
    
    /**
     * GET /api/chat-history/recent - Conversaciones recientes
     * USO: Dashboard o vista rápida
     */
    @GetMapping("/recent")
    public ResponseEntity<List<UserQuery>> getRecentChatHistory(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        List<UserQuery> recent = chatHistoryService.getRecentUserQueries(userId);
        return ResponseEntity.ok(recent);
    }
    
    /**
     * POST /api/chat-history - Crear nueva query
     * USO: Llamado desde n8n O desde Angular antes de enviar a n8n
     */
    @PostMapping
    public ResponseEntity<UserQuery> createChatEntry(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateChatRequest request) {
        
        Long userId = getUserIdFromToken(authHeader);
        UserQuery newQuery = chatHistoryService.saveUserQuery(
            userId, 
            request.getQueryText(), 
            request.getQueryType()
        );
        return ResponseEntity.ok(newQuery);
    }
      /**
     * PUT /api/chat-history/{id}/response - Actualizar respuesta
     * USO: Llamado desde n8n después de procesar la query
     */
    @PutMapping("/{id}/response")
    public ResponseEntity<UserQuery> updateChatResponse(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody UpdateResponseRequest request) {
        
        // Verificar que el usuario tiene autorización (el token es válido)
        getUserIdFromToken(authHeader);
        
        UserQuery updated = chatHistoryService.updateQueryResponse(
            id, 
            request.getResponseText(),
            request.getResponseData(),
            request.getSources()
        );
        return ResponseEntity.ok(updated);
    }
    
    /**
     * DELETE /api/chat-history/{id} - Eliminar entrada
     * USO: Gestión de historial desde el frontend
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteChatEntry(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        
        Long userId = getUserIdFromToken(authHeader);
        boolean deleted = chatHistoryService.deleteUserQuery(userId, id);
        return ResponseEntity.ok(Map.of("success", deleted));
    }    /**
     * GET /api/chat-history/stats - Estadísticas de uso simplificadas
     * USO: Analytics o dashboard
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getChatStats(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        ChatHistoryService.ChatHistoryStats stats = chatHistoryService.getUserChatStats(userId);
        
        // Convertir a formato simple para Angular
        Map<String, Object> response = Map.of(
            "totalQueries", stats.getTotalQueries(),
            "recentQueries", stats.getRecentQueries()
        );
        return ResponseEntity.ok(response);
    }
    
    // Método auxiliar para extraer userId del token JWT
    private Long getUserIdFromToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.extractUserId(token);
        }
        throw new IllegalArgumentException("Token de autorización inválido");
    }
}
