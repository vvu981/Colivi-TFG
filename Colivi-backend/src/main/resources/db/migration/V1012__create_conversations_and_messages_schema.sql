CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    host_id UUID NOT NULL,
    active_booking_request_id UUID,
    last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_preview VARCHAR(160),
    tenant_unread_count INT NOT NULL DEFAULT 0,
    host_unread_count INT NOT NULL DEFAULT 0,
    user_message_count INT NOT NULL DEFAULT 0,
    nudge_sent BOOLEAN NOT NULL DEFAULT FALSE,
    archived_by_host BOOLEAN NOT NULL DEFAULT FALSE,
    archived_by_tenant BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_conversation_tenant_host_listing 
        UNIQUE (tenant_id, host_id, listing_id),
    CONSTRAINT fk_conversations_listing 
        FOREIGN KEY (listing_id) 
        REFERENCES accommodation_listing (id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_conversations_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES "user" (id) 
        ON DELETE RESTRICT,
    CONSTRAINT fk_conversations_host 
        FOREIGN KEY (host_id) 
        REFERENCES "user" (id) 
        ON DELETE RESTRICT,
    CONSTRAINT fk_conversations_booking_request 
        FOREIGN KEY (active_booking_request_id) 
        REFERENCES booking_requests (id) 
        ON DELETE SET NULL
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'USER_MESSAGE',
    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    CONSTRAINT fk_messages_conversation 
        FOREIGN KEY (conversation_id) 
        REFERENCES conversations (id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender 
        FOREIGN KEY (sender_id) 
        REFERENCES "user" (id) 
        ON DELETE RESTRICT
);

CREATE INDEX idx_conversations_inbox_tenant 
    ON conversations (tenant_id, archived_by_tenant, last_message_at DESC);

CREATE INDEX idx_conversations_inbox_host 
    ON conversations (host_id, archived_by_host, last_message_at DESC);

CREATE INDEX idx_messages_conversation_ordered 
    ON messages (conversation_id, created_at ASC);
