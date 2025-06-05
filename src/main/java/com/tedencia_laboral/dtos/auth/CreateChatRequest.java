package com.tedencia_laboral.dtos.auth;

public class CreateChatRequest {
    private String queryText;
    private String queryType;

    public CreateChatRequest() {}

    public CreateChatRequest(String queryText, String queryType) {
        this.queryText = queryText;
        this.queryType = queryType;
    }

    public String getQueryText() {
        return queryText;
    }

    public void setQueryText(String queryText) {
        this.queryText = queryText;
    }

    public String getQueryType() {
        return queryType;
    }

    public void setQueryType(String queryType) {
        this.queryType = queryType;
    }
}
