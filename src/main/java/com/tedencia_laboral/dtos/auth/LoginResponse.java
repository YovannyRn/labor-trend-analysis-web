package com.tedencia_laboral.dtos.auth;

import com.tedencia_laboral.enums.RoleName;



public class LoginResponse {

    private String token;

    private String username;

    private RoleName role;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public RoleName getRole() {
        return role;
    }

    public void setRole(RoleName role) {
        this.role = role;
    }
}