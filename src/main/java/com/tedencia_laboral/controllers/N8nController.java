package com.tedencia_laboral.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/n8n")
@CrossOrigin("*")
public class N8nController {

    @Value("${n8n.url}")
    private String n8nUrl;

    private final RestTemplate restTemplate;

    public N8nController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @PostMapping("/process")
    public ResponseEntity<String> sendToN8n(@RequestBody String userRequest) {
        // Enviar la solicitud del usuario a n8n
        String n8nEndpoint = n8nUrl + "/webhook-test/process-user-request"; // Cambia "/webhook-test/process-user-request" por el endpoint configurado en n8n
        ResponseEntity<String> response = restTemplate.postForEntity(n8nEndpoint, userRequest, String.class);

        // Retornar la respuesta de n8n
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }
}
