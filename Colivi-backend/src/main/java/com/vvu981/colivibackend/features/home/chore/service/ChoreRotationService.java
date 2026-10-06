package com.vvu981.colivibackend.features.home.chore.service;

import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreSeries;
import com.vvu981.colivibackend.features.home.chore.dto.CreateChoreRequest;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.user.domain.User;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ChoreRotationService {

    ChoreSeries createSeries(Home home, CreateChoreRequest request, List<User> orderedParticipants);

    List<Chore> generateOccurrences(ChoreSeries series, LocalDate baseDate, List<User> orderedParticipants);

    void handleUserLeftHome(UUID homeId, UUID userId);

    void reassignPendingChores(ChoreSeries series);
}
