import * as pcap from "pcap";

const pcap_session = pcap.createSession('');

pcap_session.on('packet', function(raw_packet) {
    const packet = pcap.decode.packet(raw_packet);
    if (packet.payload?.payload?.saddr?.addr?.join(".") === "192.168.1.13") {
        console.log(packet);
        process.exit();
    }
});