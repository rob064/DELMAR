/**
 * Valida una cédula ecuatoriana
 * @param cedula - Número de cédula de 10 dígitos
 * @returns true si la cédula es válida, false en caso contrario
 */
export function validarCedulaEcuatoriana(cedula: string): boolean {
  // Eliminar espacios y guiones
  cedula = cedula.replace(/\s|-/g, "");

  // Verificar que tenga exactamente 10 dígitos
  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  // Extraer los componentes
  const provincia = parseInt(cedula.substring(0, 2));
  const tercerDigito = parseInt(cedula.charAt(2));
  const digitoVerificador = parseInt(cedula.charAt(9));

  // Validar código de provincia (01-24)
  if (provincia < 1 || provincia > 24) {
    return false;
  }

  // Validar tercer dígito (debe ser menor a 6 para personas naturales)
  if (tercerDigito >= 6) {
    return false;
  }

  // Algoritmo de validación del dígito verificador
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i)) * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  const residuo = suma % 10;
  const resultado = residuo === 0 ? 0 : 10 - residuo;

  return resultado === digitoVerificador;
}

/**
 * Formatea una cédula ecuatoriana
 * @param cedula - Número de cédula
 * @returns Cédula formateada como XXXX-XXXX-XX
 */
export function formatearCedula(cedula: string): string {
  cedula = cedula.replace(/\D/g, "");
  if (cedula.length === 10) {
    return `${cedula.substring(0, 4)}-${cedula.substring(4, 8)}-${cedula.substring(8, 10)}`;
  }
  return cedula;
}
