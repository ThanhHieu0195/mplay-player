import axios from 'axios';
import Hls from 'hls.js';

class HlsPlayer {

    constructor(api_path) {
        this.api_path = api_path;
        this.path_ip_info = 'http://ipinfo.io';
    }

    async build(stream_url, vod_url, video) {
        const cdn_token = await this.generateCdnToken(stream_url);
        const hls = new Hls({
            enableWorker: false,
            loop: true,
            xhrSetup: (xhr, url) => {
                xhr.open('GET', `${url}?${cdn_token}`, true);
            }
        });

        hls.loadSource(vod_url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED,function() {
            console.log('Running ...');
            video.play();
        });
        return hls;
    }

    async getIp() {
        if (!this.ip) {
            const result = await axios.get(this.path_ip_info);
            if (result.data && result.data.ip) {
                this.ip = result.data.ip;
            }
        }
        return this.ip;
    }

    async generateCdnToken(stream_url) {
        const ip = await this.getIp();
        const body = `ecexpire=${Math.floor((Date.now() + 259200000) / 1000)}&ec_proto_allow=${window.location.protocol.split(':')[0]}&ec_ref_allow=${window.location.host}&ec_clientip=${ip}`;
        const path = this.api_path + 'api/v1/cdntoken';
        const result = await axios({
            method: 'POST',
            url: path,
            data: {
                type: 'bunny',
                sid: stream_url,
                ip: ip,
                params: body
            },
        });

        if (result.status == 201) {
            return result.data.cdn_token;
        }
        return null;
    }
}

export default HlsPlayer;