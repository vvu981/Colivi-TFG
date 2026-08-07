package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.Balance;
import com.vvu981.colivibackend.features.home.domain.DebtTransfer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TransitDebtSimplifierTest {

    private DebtSimplifierEngine simplifierEngine;

    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();
    private final UUID userC = UUID.randomUUID();
    private final UUID deudorA = UUID.randomUUID();
    private final UUID deudorB = UUID.randomUUID();
    private final UUID acreedorX = UUID.randomUUID();
    private final UUID acreedorY = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        simplifierEngine = new TransitDebtSimplifier();
    }

    @Test
    void escenario_1_deuda_directa_simple() {
        List<Balance> balances = List.of(
                new Balance(userA, new BigDecimal("-50.0")),
                new Balance(userB, new BigDecimal("50.0"))
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        assertEquals(1, result.size());
        assertEquals(userA, result.get(0).fromUserId());
        assertEquals(userB, result.get(0).toUserId());
        assertEquals(0, new BigDecimal("50.0").compareTo(result.get(0).amount()));
    }

    @Test
    void escenario_2_un_deudor_paga_a_varios_acreedores() {
        List<Balance> balances = List.of(
                new Balance(userA, new BigDecimal("-100.0")),
                new Balance(userB, new BigDecimal("50.0")),
                new Balance(userC, new BigDecimal("50.0"))
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        assertEquals(2, result.size());

        BigDecimal totalPagadoPorA = result.stream()
                .filter(t -> t.fromUserId().equals(userA))
                .map(DebtTransfer::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(0, new BigDecimal("100.0").compareTo(totalPagadoPorA));
    }

    @Test
    void escenario_3_varios_deudores_pagan_a_un_solo_acreedor() {
        List<Balance> balances = List.of(
                new Balance(userA, new BigDecimal("-30.0")),
                new Balance(userB, new BigDecimal("-30.0")),
                new Balance(userC, new BigDecimal("60.0"))
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        assertEquals(2, result.size());

        BigDecimal totalRecibidoPorC = result.stream()
                .filter(t -> t.toUserId().equals(userC))
                .map(DebtTransfer::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(0, new BigDecimal("60.0").compareTo(totalRecibidoPorC));
    }

    @Test
    void escenario_4_saldos_a_cero_son_ignorados() {
        List<Balance> balances = List.of(
                new Balance(userA, BigDecimal.ZERO),
                new Balance(userB, BigDecimal.ZERO),
                new Balance(userC, BigDecimal.ZERO)
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        assertTrue(result.isEmpty());
    }

    @Test
    void escenario_5_unbalanced_creditors_run_out_first() {
        List<Balance> balances = List.of(
                new Balance(userA, new BigDecimal("-100.0")),
                new Balance(userB, new BigDecimal("50.0"))
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);
        assertEquals(1, result.size());
    }

    @Test
    void escenario_6_lista_vacia() {
        List<Balance> balances = List.of();

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        assertTrue(result.isEmpty());
    }

    @Test
    void escenario_7_deudores_se_agotan_antes_que_acreedores() {
        List<Balance> balances = List.of(
                new Balance(userA, new BigDecimal("-30.0")),
                new Balance(userB, new BigDecimal("50.0")),
                new Balance(userC, new BigDecimal("50.0"))
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        assertEquals(1, result.size());
        assertEquals(userA, result.get(0).fromUserId());
        assertEquals(0, new BigDecimal("30.0").compareTo(result.get(0).amount()));
    }

    @Test
    void escenario_8_multiples_deudores_y_acreedores() {
        List<Balance> balances = List.of(
                new Balance(deudorA, new BigDecimal("-70.0")),
                new Balance(deudorB, new BigDecimal("-30.0")),
                new Balance(acreedorX, new BigDecimal("60.0")),
                new Balance(acreedorY, new BigDecimal("40.0"))
        );

        List<DebtTransfer> result = simplifierEngine.simplify(balances);

        BigDecimal totalTransferido = result.stream()
                .map(DebtTransfer::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        assertEquals(0, new BigDecimal("100.0").compareTo(totalTransferido));
    }
}
