package com.tedencia_laboral.dtos.auth;

public class UpdateResponseRequest {
    private String responseText;
    private String responseData;
    private String sources;

    public UpdateResponseRequest() {}

    public UpdateResponseRequest(String responseText, String responseData, String sources) {
        this.responseText = responseText;
        this.responseData = responseData;
        this.sources = sources;
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

    public String getResponseData() {
        return responseData;
    }

    public void setResponseData(String responseData) {
        this.responseData = responseData;
    }

    public String getSources() {
        return sources;
    }

    public void setSources(String sources) {
        this.sources = sources;
    }
}
