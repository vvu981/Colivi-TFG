package com.vvu981.colivibackend.features.home.service.formatter;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;

public interface ActivityLogFormatter<T extends HomeActivityEvent> {
    
    /**
     * Determines whether this formatter supports the given event.
     */
    boolean supports(HomeActivityEvent event);

    /**
     * Formats the specific event into an ActivityLog entity.
     */
    ActivityLog format(T event);
}
