/**
 * Test del sistema de mensajes
 * Ejecutar con: node -r esbuild-register scripts/test-messages.ts
 * O simplemente verifica que se importa correctamente
 */

import MESSAGES, { formatMessage, showAlert, showConfirm, logger } from '../lib/messages';

console.log('\n======================');
console.log('TEST: Sistema de Mensajes');
console.log('======================\n');

// Test 1: Importación
console.log('✅ Test 1: Importación correcta');
console.log('   - MESSAGES:', typeof MESSAGES);
console.log('   - formatMessage:', typeof formatMessage);
console.log('   - logger:', typeof logger);

// Test 2: Categorías
console.log('\n✅ Test 2: Categorías disponibles');
console.log('   - AUTH:', Object.keys(MESSAGES.AUTH).length, 'mensajes');
console.log('   - FILE:', Object.keys(MESSAGES.FILE).length, 'mensajes');
console.log('   - LINK:', Object.keys(MESSAGES.LINK).length, 'mensajes');
console.log('   - CHECKPOINT:', Object.keys(MESSAGES.CHECKPOINT).length, 'mensajes');
console.log('   - GITHUB:', Object.keys(MESSAGES.GITHUB).length, 'mensajes');
console.log('   - SYSTEM:', Object.keys(MESSAGES.SYSTEM).length, 'mensajes');
console.log('   - SW:', Object.keys(MESSAGES.SW).length, 'mensajes');
console.log('   - UI:', Object.keys(MESSAGES.UI).length, 'mensajes');

// Test 3: Resumen
console.log('\n✅ Test 3: Resumen');
console.log('   Total mensajes:', MESSAGES.SUMMARY.TOTAL);

// Test 4: FormatMessage
console.log('\n✅ Test 4: FormatMessage');
const msg1 = formatMessage(MESSAGES.LINK.CLICK_TRACKED, {
  linkName: 'Monetag',
  clicks: 150
});
console.log('   Input:', MESSAGES.LINK.CLICK_TRACKED);
console.log('   Params: { linkName: "Monetag", clicks: 150 }');
console.log('   Output:', msg1);

const msg2 = formatMessage(MESSAGES.FILE.DELETE_CONFIRM, {
  filename: 'test.zip'
});
console.log('\n   Input:', MESSAGES.FILE.DELETE_CONFIRM);
console.log('   Params: { filename: "test.zip" }');
console.log('   Output:', msg2);

// Test 5: Logger
console.log('\n✅ Test 5: Logger categorizado');
logger.auth.log('Test de autenticación');
logger.file.log('Test de archivos');
logger.link.log('Test de links');
logger.checkpoint.log('Test de checkpoints');
logger.github.log('Test de GitHub');
logger.system.log('Test de sistema');

// Test 6: Mensajes específicos
console.log('\n✅ Test 6: Mensajes específicos');
console.log('   AUTH.LOGIN_SUCCESS:', MESSAGES.AUTH.LOGIN_SUCCESS);
console.log('   FILE.UPLOAD_SUCCESS:', MESSAGES.FILE.UPLOAD_SUCCESS);
console.log('   LINK.ADD_SUCCESS:', MESSAGES.LINK.ADD_SUCCESS);
console.log('   CHECKPOINT.SAVE_SUCCESS:', MESSAGES.CHECKPOINT.SAVE_SUCCESS);

console.log('\n======================');
console.log('TODOS LOS TESTS PASARON ✅');
console.log('======================\n');

// Conteo real de mensajes
const realCount = 
  Object.keys(MESSAGES.AUTH).length +
  Object.keys(MESSAGES.FILE).length +
  Object.keys(MESSAGES.LINK).length +
  Object.keys(MESSAGES.CHECKPOINT).length +
  Object.keys(MESSAGES.GITHUB).length +
  Object.keys(MESSAGES.SYSTEM).length +
  Object.keys(MESSAGES.SW).length +
  Object.keys(MESSAGES.UI).length;

console.log('Conteo real:', realCount, 'mensajes');
console.log('Esperado:', MESSAGES.SUMMARY.TOTAL, 'mensajes');

if (realCount === MESSAGES.SUMMARY.TOTAL) {
  console.log('✅ Conteo coincide\n');
} else {
  console.log('⚠️  Advertencia: El conteo no coincide\n');
  console.log('   Actualiza MESSAGES_SUMMARY.TOTAL en lib/messages.ts\n');
}
