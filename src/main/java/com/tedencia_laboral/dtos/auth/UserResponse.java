package com.tedencia_laboral.dtos.auth;


    public class UserResponse {
        private Long id;
        private String username;
        private String firstName;
        private String lastName;
        private String address;

        // Constructor vacío (necesario para deserialización)
        public UserResponse() {
        }

        // Constructor con todos los campos
        public UserResponse(Long id, String username, String firstName, String lastName, String address) {
            this.id = id;
            this.username = username;
            this.firstName = firstName;
            this.lastName = lastName;
            this.address = address;

        }

        // Getters y Setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

    }

