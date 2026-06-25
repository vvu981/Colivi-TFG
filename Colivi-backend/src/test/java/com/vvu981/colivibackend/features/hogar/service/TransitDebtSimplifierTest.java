package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.Balance;
import com.vvu981.colivibackend.features.home.domain.DebtTransfer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TransitDebtSimplifierTest {

    private DebtSimplifierEngine simplifierEngine;

    // Esta es la clase que implementaremos después.
    // Ahora mismo solo lanza una excepción para que el test falle a propósito.
    @BeforeEach
    void setUp() {
        simplifierEngine = new TransitDebtSimplifier();
    }

    @Test
    void escenario_1_deuda_directa_simple() {
        // Un deudor y un acreedor exactos
        List<Balance> balances = List.of(
                new Balance("userA", -50.0),
                new Balance("userB", 50.0)
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        assertEquals(1, result.size());
        assertEquals("userA", result.get(0).fromUserId());
        assertEquals("userB", result.get(0).toUserId());
        assertEquals(50.0, result.get(0).amount());
    }

    @Test
    void escenario_2_un_deudor_paga_a_varios_acreedores() {
        // userA debe 100 en total. userB y userC deben recibir 50 cada uno.
        List<Balance> balances = List.of(
                new Balance("userA", -100.0),
                new Balance("userB", 50.0),
                new Balance("userC", 50.0)
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        assertEquals(2, result.size());

        // Verificamos que userA emite ambas transferencias por un total de 100
        double totalPagadoPorA = result.stream()
                .filter(t -> t.fromUserId().equals("userA"))
                .mapToDouble(DebtTransfer::amount)
                .sum();

        assertEquals(100.0, totalPagadoPorA);
    }

    @Test
    void escenario_3_varios_deudores_pagan_a_un_solo_acreedor() {
        // userA y userB deben 30 cada uno. userC debe recibir 60.
        List<Balance> balances = List.of(
                new Balance("userA", -30.0),
                new Balance("userB", -30.0),
                new Balance("userC", 60.0)
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        assertEquals(2, result.size());

        // Verificamos que userC recibe exactamente 60
        double totalRecibidoPorC = result.stream()
                .filter(t -> t.toUserId().equals("userC"))
                .mapToDouble(DebtTransfer::amount)
                .sum();

        assertEquals(60.0, totalRecibidoPorC);
    }

    @Test
    void escenario_4_saldos_a_cero_son_ignorados() {
        // Si nadie debe nada, no debe haber transferencias
        List<Balance> balances = List.of(
                new Balance("userA", 0.0),
                new Balance("userB", 0.0),
                new Balance("userC", 0.0)
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        assertTrue(result.isEmpty());
    }
}