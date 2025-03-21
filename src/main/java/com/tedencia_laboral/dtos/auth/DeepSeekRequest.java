package com.tedencia_laboral.dtos.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeepSeekRequest {

    private String model;
    private String prompt;

}
