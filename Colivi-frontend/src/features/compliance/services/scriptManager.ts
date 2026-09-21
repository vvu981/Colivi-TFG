import type { CookieConsentPreferences, ScriptConfig } from '../types/cookieTypes';

class ScriptManager {
  private scripts: Map<string, ScriptConfig> = new Map();
  private executedScripts: Set<string> = new Set();

  /**
   * Registra una configuración de script de terceros dependiente de consentimiento.
   */
  public registerScript(config: ScriptConfig): void {
    this.scripts.set(config.id, config);
  }

  /**
   * Desregistra un script por su identificador.
   */
  public unregisterScript(id: string): void {
    this.scripts.delete(id);
    this.executedScripts.delete(id);
  }

  /**
   * Aplica las preferencias del usuario ejecutando o limpiando los scripts según corresponda.
   * Garantiza opt-in estricto: ningún script se ejecuta si su categoría no ha sido expresamente aceptada.
   */
  public applyConsent(preferences: CookieConsentPreferences): void {
    this.scripts.forEach((config) => {
      const isAllowed = preferences[config.category] === true;
      const isAlreadyExecuted = this.executedScripts.has(config.id);

      if (isAllowed && !isAlreadyExecuted) {
        this.executeScript(config);
      } else if (!isAllowed && isAlreadyExecuted) {
        this.cleanupScript(config);
      }
    });
  }

  private executeScript(config: ScriptConfig): void {
    if (config.src && typeof document !== 'undefined') {
      const existing = document.querySelector(`script[data-consent-id="${config.id}"]`);
      if (!existing) {
        const scriptElement = document.createElement('script');
        scriptElement.setAttribute('data-consent-id', config.id);
        scriptElement.src = config.src;
        if (config.async) scriptElement.async = true;
        if (config.defer) scriptElement.defer = true;
        document.head.appendChild(scriptElement);
      }
    }

    if (config.execute) {
      try {
        config.execute();
      } catch (error) {
        console.error(`[ScriptManager] Error executing script ${config.id}:`, error);
      }
    }

    this.executedScripts.add(config.id);
  }

  private cleanupScript(config: ScriptConfig): void {
    if (typeof document !== 'undefined') {
      const scriptElement = document.querySelector(`script[data-consent-id="${config.id}"]`);
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    }

    if (config.cleanup) {
      try {
        config.cleanup();
      } catch (error) {
        console.error(`[ScriptManager] Error cleaning up script ${config.id}:`, error);
      }
    }

    this.executedScripts.delete(config.id);
  }

  /**
   * Retorna los identificadores de scripts que actualmente se encuentran ejecutados.
   */
  public getExecutedScriptIds(): string[] {
    return Array.from(this.executedScripts);
  }

  /**
   * Limpia todo el estado de scripts (útil para pruebas unitarias y reinicio de sesión).
   */
  public reset(): void {
    this.scripts.forEach((config) => {
      if (this.executedScripts.has(config.id)) {
        this.cleanupScript(config);
      }
    });
    this.scripts.clear();
    this.executedScripts.clear();
  }
}

export const scriptManager = new ScriptManager();
