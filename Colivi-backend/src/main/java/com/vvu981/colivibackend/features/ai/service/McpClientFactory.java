package com.vvu981.colivibackend.features.ai.service;

import io.modelcontextprotocol.client.McpSyncClient;

@FunctionalInterface
public interface McpClientFactory {
    McpSyncClient createClient(String sseBaseUri);
}
