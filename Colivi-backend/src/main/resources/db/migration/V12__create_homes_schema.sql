CREATE TABLE homes (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    invitation_code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
);

CREATE TABLE home_members (
    id UUID PRIMARY KEY,
    home_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    joined_at TIMESTAMP NOT NULL,
    left_at TIMESTAMP,
    CONSTRAINT fk_home_members_home FOREIGN KEY (home_id) REFERENCES homes(id) ON DELETE CASCADE,
    CONSTRAINT fk_home_members_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT uk_home_user UNIQUE (home_id, user_id)
);

CREATE INDEX idx_homes_invitation_code ON homes(invitation_code);
CREATE INDEX idx_home_members_user_status ON home_members(user_id, status);