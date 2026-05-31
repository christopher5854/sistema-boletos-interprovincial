const db = require('../../config/db');

const obtener = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cooperativas WHERE estado = 1');
        res.json(rows[0] || {});
    } catch (error) {
        console.error('Error al obtener cooperativa:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const actualizar = async (req, res) => {
    try {
        const {
            nombre, ruc, logo_url, color_primario, color_secundario,
            telefono_soporte, correo_soporte, direccion,
            facebook_url, instagram_url, twitter_url, whatsapp
        } = req.body;

        await db.query(
            `UPDATE cooperativas SET 
                nombre = ?, ruc = ?, logo_url = ?, color_primario = ?, color_secundario = ?,
                telefono_soporte = ?, correo_soporte = ?, direccion = ?,
                facebook_url = ?, instagram_url = ?, twitter_url = ?, whatsapp = ?
             WHERE estado = 1`,
            [nombre, ruc, logo_url, color_primario, color_secundario,
             telefono_soporte, correo_soporte, direccion,
             facebook_url, instagram_url, twitter_url, whatsapp]
        );

        res.json({ mensaje: 'Cooperativa actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar cooperativa:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { obtener, actualizar };