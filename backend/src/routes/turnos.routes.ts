import { Router } from 'express';
import {
    getTurnos,
    getTurnoById,
    createTurno,
    updateTurno,
    deleteTurno,
    obtenerTurnosAsignados,
    asignarTurno
} from '../controllers/turno.controller';

const router = Router();

router.get('/', getTurnos);
router.get('/asignados', obtenerTurnosAsignados);
router.get('/:id', getTurnoById);
router.post('/', createTurno);
router.post('/asignar', asignarTurno);
router.put('/:id', updateTurno);
router.delete('/:id', deleteTurno);

export default router;