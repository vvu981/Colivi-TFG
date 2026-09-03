package com.vvu981.colivibackend.features.home.service.formatter;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.home.domain.event.PaymentRecordedEvent;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class PaymentRecordedActivityFormatter implements ActivityLogFormatter<PaymentRecordedEvent> {

    @Override
    public boolean supports(HomeActivityEvent event) {
        return event instanceof PaymentRecordedEvent;
    }

    @Override
    public ActivityLog format(PaymentRecordedEvent event) {
        ActivityLog log = new ActivityLog();

        Home home = new Home();
        home.setId(event.homeId());
        log.setHome(home);

        User actor = new User();
        actor.setId(event.actorId());
        log.setActor(actor);

        log.setActivityType(event.activityType());

        String desc = "Ha registrado un pago de " + event.amount() + " € a " + event.receiverName() + ".";
        log.setDescription(desc);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("payerId", event.payerId().toString());
        metadata.put("receiverId", event.receiverId().toString());
        metadata.put("receiverName", event.receiverName());
        metadata.put("amount", event.amount().toString());
        if (event.notes() != null && !event.notes().isBlank()) {
            metadata.put("notes", event.notes());
        }

        log.setMetadata(metadata);
        return log;
    }
}
