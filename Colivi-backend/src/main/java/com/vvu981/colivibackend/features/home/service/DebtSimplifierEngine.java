package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.Balance;
import com.vvu981.colivibackend.features.home.domain.DebtTransfer;

import java.util.List;

public interface DebtSimplifierEngine {

    /**
     * Toma una lista de saldos consolidados y devuelve la lista mínima de
     * transferencias necesarias para que todos los saldos queden a cero.
     *
     * @param balances Lista de saldos actuales de los usuarios.
     * @return Lista de transferencias directas sugeridas.
     */
    List<DebtTransfer> simplify(List<Balance> balances);
}
