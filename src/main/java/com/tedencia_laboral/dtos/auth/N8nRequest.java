package com.tedencia_laboral.dtos.auth;

import com.fasterxml.jackson.annotation.JsonProperty;

public class N8nRequest {
    private Long userId;
    
    private String userName;
    
    private String message;

    @JsonProperty("request_type")
    private String requestType; // 'chat', 'graph', 'sources'

    // Constructores
    public N8nRequest() {}

    public N8nRequest(Long userId, String userName, String message, String requestType) {
        this.userId = userId;
        this.userName = userName;
        this.message = message;
        this.requestType = requestType;
    }

    // Getters y setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    // Métodos de validación y utilidad
    public boolean isValidRequestType() {
        return requestType != null && 
               (requestType.equals("chat") || 
                requestType.equals("graph") || 
                requestType.equals("sources"));
    }

    public String getRequestTypeOrDefault() {
        return requestType != null ? requestType : "chat";
    }

    public boolean isValid() {
        return userId != null && 
               message != null && 
               !message.trim().isEmpty();
    }

    @Override
    public String toString() {
        return "N8nRequest{" +
                "userId=" + userId +
                ", userName='" + userName + '\'' +
                ", message='" + message + '\'' +
                ", requestType='" + requestType + '\'' +
                '}';
    }
}