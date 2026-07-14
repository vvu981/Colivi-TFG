package com.vvu981.colivibackend.core.exception;

public class BusinessRuleValidationException extends RuntimeException {
    public BusinessRuleValidationException(String message) {
        super(message);
    }
}
