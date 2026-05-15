/**
 * MySQL rejects large INSERTs (e.g. base64 images) when over max_allowed_packet.
 */
function isMaxAllowedPacketError(err) {
  const msg = (err && (err.message || (err.original && err.original.message))) || '';
  return typeof msg === 'string' && msg.toLowerCase().includes('max_allowed_packet');
}

function packetTooLargeResponse() {
  return {
    error:
      'Database packet limit too small for this image. Increase MySQL max_allowed_packet (e.g. 64M under [mysqld] in my.ini) and restart MySQL. See server/scripts/mysql-max-packet.sql.',
  };
}

module.exports = { isMaxAllowedPacketError, packetTooLargeResponse };
