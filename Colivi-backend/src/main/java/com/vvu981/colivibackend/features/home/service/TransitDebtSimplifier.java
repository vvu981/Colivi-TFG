package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.Balance;
import com.vvu981.colivibackend.features.home.domain.DebtTransfer;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransitDebtSimplifier implements DebtSimplifierEngine {

    @Override
    public List<DebtTransfer> simplify(List<Balance> balances) {
        List<DebtTransfer> transfers = new ArrayList<>();

        // 1. Separar y ordenar deudores (los que deben, ordenados por mayor deuda absoluta)
        List<Balance> debtors = balances.stream()
                .filter(b -> b.amount() < 0)
                .sorted(Comparator.comparingDouble(Balance::amount))
                .collect(Collectors.toList());

        // 2. Separar y ordenar acreedores (los que deben recibir, ordenados de mayor a menor)
        List<Balance> creditors = balances.stream()
                .filter(b -> b.amount() > 0)
                .sorted(Comparator.comparingDouble(Balance::amount).reversed())
                .collect(Collectors.toList());

        int i = 0; // Puntero para recorrer los deudores
        int j = 0; // Puntero para recorrer los acreedores

        // 3. Algoritmo de dos punteros para liquidación directa
        while (i < debtors.size() && j < creditors.size()) {
            Balance currentDebtor = debtors.get(i);
            Balance currentCreditor = creditors.get(j);

            double debt = Math.abs(currentDebtor.amount());
            double credit = currentCreditor.amount();

            // Determinar cuánto se puede transferir en este paso (el mínimo entre la deuda y el crédito)
            double amountToTransfer = Math.min(debt, credit);

            // Registrar la orden de pago
            transfers.add(new DebtTransfer(currentDebtor.userId(), currentCreditor.userId(), amountToTransfer));

            // Calcular saldos restantes tras el pago
            double remainingDebt = debt - amountToTransfer;
            double remainingCredit = credit - amountToTransfer;

            // Actualizar punteros o actualizar saldos restantes
            if (remainingDebt == 0) {
                i++; // El deudor ha saldado su cuenta por completo
            } else {
                debtors.set(i, new Balance(currentDebtor.userId(), -remainingDebt));
            }

            if (remainingCredit == 0) {
                j++; // El acreedor ha recibido todo su dinero
            } else {
                creditors.set(j, new Balance(currentCreditor.userId(), remainingCredit));
            }
        }

        return transfers;
    }
}