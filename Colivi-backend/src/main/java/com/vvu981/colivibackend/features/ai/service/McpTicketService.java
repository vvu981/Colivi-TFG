package com.vvu981.colivibackend.features.ai.service;

public interface McpTicketService {
    String fetchTicket(String cleanMcpUrl, String jwtToken);
}
