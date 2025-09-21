package com.tedencia_laboral.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tedencia_laboral.dtos.auth.N8nRequest;
import com.tedencia_laboral.dtos.auth.N8nResponse;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/n8n")
@CrossOrigin("*")
public class N8nController {

    @Value("${n8n.url}")
    private String n8nUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public N8nController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/process")
    public ResponseEntity<N8nResponse> sendToN8n(@RequestBody N8nRequest userRequest) {
        try {
            String n8nEndpoint = n8nUrl + "/webhook-test/process-user-request";

            String rawResponse = restTemplate.postForObject(n8nEndpoint, userRequest, String.class);

            N8nResponse response = processResponse(rawResponse);

            return ResponseEntity.ok(response);

        } catch (RestClientException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Error conectando con n8n: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("Error interno: " + e.getMessage()));
        }
    }    private N8nResponse processResponse(String rawResponse) {
        N8nResponse response = new N8nResponse();

        if (rawResponse == null || rawResponse.trim().isEmpty()) {
            return createErrorResponse("Respuesta vacía de n8n");
        }

        try {
            String cleanResponse = rawResponse.trim();

            if (cleanResponse.startsWith("{") || cleanResponse.startsWith("[")) {
                // Es JSON, intentar parsear
                JsonNode rootNode = objectMapper.readTree(cleanResponse);

                // Si es array, tomar primer elemento
                if (rootNode.isArray() && rootNode.size() > 0) {
                    rootNode = rootNode.get(0);
                }

                // Mapear campos del JSON de n8n a nuestro DTO
                response.setSuccess(rootNode.has("success") ? rootNode.get("success").asBoolean() : true);
                
                // response_type
                if (rootNode.has("response_type")) {
                    response.setResponseType(rootNode.get("response_type").asText());
                } else {
                    response.setResponseType("text");
                }

                // message
                if (rootNode.has("message")) {
                    response.setMessage(rootNode.get("message").asText());
                } else if (rootNode.has("output")) {
                    response.setMessage(rootNode.get("output").asText());
                }                // structured_data
                if (rootNode.has("structured_data") && !rootNode.get("structured_data").isNull()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> structuredData = objectMapper.convertValue(rootNode.get("structured_data"), Map.class);
                    response.setStructuredData(structuredData);
                }

                // sources - convertir array JSON a List<String>
                if (rootNode.has("sources") && rootNode.get("sources").isArray()) {
                    List<String> sourcesList = new ArrayList<>();
                    for (JsonNode sourceNode : rootNode.get("sources")) {
                        sourcesList.add(sourceNode.asText());
                    }
                    response.setSources(sourcesList);
                } else {
                    response.setSources(new ArrayList<>());
                }

                // output para compatibilidad
                response.setOutput(rootNode.toString());

            } else {
                // Es texto plano
                response.setSuccess(true);
                response.setResponseType("text");
                response.setMessage(cleanResponse);
                response.setOutput(cleanResponse);
                response.setSources(new ArrayList<>());
            }

        } catch (Exception e) {
            // Si falla el parseo, devolver como texto
            response.setSuccess(true);
            response.setResponseType("text");
            response.setMessage(rawResponse);
            response.setOutput(rawResponse);
            response.setSources(new ArrayList<>());
        }

        // Agregar timestamp en formato ISO
        response.setTimestamp(ZonedDateTime.now().format(DateTimeFormatter.ISO_INSTANT));

        return response;
    }    private N8nResponse createErrorResponse(String errorMessage) {
        N8nResponse response = new N8nResponse();
        response.setSuccess(false);
        response.setResponseType("text");
        response.setMessage(errorMessage);
        response.setSources(new ArrayList<>());
        response.setTimestamp(ZonedDateTime.now().format(DateTimeFormatter.ISO_INSTANT));
        return response;
    }
}