import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MateriaData {
    mat_id?: number;
    mat_cod: string;
    mat_departamento: string;
    mat_nombre: string;
    mat_creditos: number;
    mat_taxonomia: string;
    mat_horas_teoria: number;
    mat_horas_practica: number;
    mat_horas_lab: number;
    mat_horas_est_indep: number;
    mat_modality: string;
    mat_is_requirement: boolean;
}

interface MateriaModalProps {
    isOpen: boolean;
    onClose: () => void;
    materia: MateriaData | null;
    onSave: () => void;
}

export function MateriaModal({ isOpen, onClose, materia, onSave }: MateriaModalProps) {
    const [formData, setFormData] = useState<MateriaData>({
        mat_cod: '',
        mat_departamento: '',
        mat_nombre: '',
        mat_creditos: 0,
        mat_taxonomia: '',
        mat_horas_teoria: 0,
        mat_horas_practica: 0,
        mat_horas_lab: 0,
        mat_horas_est_indep: 0,
        mat_modality: 'P',
        mat_is_requirement: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState({ mat_cod: false, mat_taxonomia: false });

    const isCodeValid = (code: string) => /^[A-Z]{4}-[A-Z0-9]{5}$/.test(code);
    const isTaxonomiaValid = (tax: string) => !tax || /^TA-[1-9][A-Z]?$/.test(tax);

    useEffect(() => {
        if (materia) {
            setFormData(materia);
        } else {
            setFormData({
                mat_cod: '',
                mat_departamento: '',
                mat_nombre: '',
                mat_creditos: 0,
                mat_taxonomia: '',
                mat_horas_teoria: 0,
                mat_horas_practica: 0,
                mat_horas_lab: 0,
                mat_horas_est_indep: 0,
                mat_modality: 'P',
                mat_is_requirement: false,
            });
        }
        setError(null);
        setTouched({ mat_cod: false, mat_taxonomia: false });
    }, [materia, isOpen]);

    const handleBlur = (field: 'mat_cod' | 'mat_taxonomia') => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // Type casting for checkbox
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        // Number fields
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.mat_cod.trim()) return 'El código de la materia es requerido';
        if (!isCodeValid(formData.mat_cod)) return 'El código debe tener el formato AAAA-XXXXX';
        if (!formData.mat_nombre.trim()) return 'El nombre de la materia es requerido';
        if (!isTaxonomiaValid(formData.mat_taxonomia)) return 'La taxonomía debe tener el formato TA-1 o TA-4E';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ mat_cod: true, mat_taxonomia: true });

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: rpcError } = await supabase.rpc('upsert_materia', {
                p_mat_id: formData.mat_id || null, // null for new inserts
                p_mat_cod: formData.mat_cod,
                p_mat_departamento: formData.mat_departamento,
                p_mat_nombre: formData.mat_nombre,
                p_mat_creditos: formData.mat_creditos,
                p_mat_taxonomia: formData.mat_taxonomia,
                p_mat_horas_teoria: formData.mat_horas_teoria,
                p_mat_horas_practica: formData.mat_horas_practica,
                p_mat_horas_lab: formData.mat_horas_lab,
                p_mat_horas_est_indep: formData.mat_horas_est_indep,
                p_mat_modality: formData.mat_modality,
                p_mat_is_requirement: formData.mat_is_requirement
            });

            if (rpcError) throw rpcError;

            onSave();
        } catch (err: any) {
            console.error('Error saving materia:', err);
            // Clean up postgres error messages if possible
            let errorMessage = err.message || 'Error al guardar la materia';
            if (err.code === '23505') { // unique_violation
                errorMessage = 'Ya existe una materia con este código.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                            {materia ? 'edit_square' : 'add_circle'}
                        </span>
                        {materia ? 'Editar Materia' : 'Nueva Materia'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form Content - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-100 flex items-start gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form id="materia-form" onSubmit={handleSubmit} className="gap-6 grid grid-cols-1 sm:grid-cols-2">

                        {/* Código */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Código *
                            </label>
                            <input
                                type="text"
                                name="mat_cod"
                                value={formData.mat_cod}
                                onChange={handleChange}
                                onBlur={() => handleBlur('mat_cod')}
                                className={`w-full rounded-lg border ${touched.mat_cod && !isCodeValid(formData.mat_cod) ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary'} bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
                                placeholder="Ej: INFO-02002"
                                required
                            />
                            {touched.mat_cod && !isCodeValid(formData.mat_cod) && (
                                <p className="text-xs text-red-500 mt-1">Formato requerido: AAAA-XXXXX</p>
                            )}
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                name="mat_nombre"
                                value={formData.mat_nombre}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                                placeholder="Nombre completo"
                                required
                            />
                        </div>

                        {/* Departamento */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Departamento
                            </label>
                            <input
                                type="text"
                                name="mat_departamento"
                                value={formData.mat_departamento || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Taxonomía */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Taxonomía
                            </label>
                            <input
                                type="text"
                                name="mat_taxonomia"
                                value={formData.mat_taxonomia || ''}
                                onChange={handleChange}
                                onBlur={() => handleBlur('mat_taxonomia')}
                                className={`w-full rounded-lg border ${touched.mat_taxonomia && !isTaxonomiaValid(formData.mat_taxonomia) ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary'} bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
                                placeholder="Ej: TA-1 o TA-4E"
                            />
                            {touched.mat_taxonomia && !isTaxonomiaValid(formData.mat_taxonomia) && (
                                <p className="text-xs text-red-500 mt-1">Formato: TA-[N] o TA-[N][Letra]</p>
                            )}
                        </div>

                        {/* Créditos */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Créditos
                            </label>
                            <input
                                type="number"
                                name="mat_creditos"
                                value={formData.mat_creditos || 0}
                                onChange={handleChange}
                                min="0"
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Modalidad */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Modalidad
                            </label>
                            <select
                                name="mat_modality"
                                value={formData.mat_modality || 'P'}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                            >
                                <option value="P">Presencial (P)</option>
                                <option value="V">Virtual / En línea (V)</option>
                            </select>
                        </div>

                        {/* Horas - Sección */}
                        <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Distribución de Horas</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Teoría</label>
                                    <input
                                        type="number"
                                        name="mat_horas_teoria"
                                        value={formData.mat_horas_teoria || 0}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Práctica</label>
                                    <input
                                        type="number"
                                        name="mat_horas_practica"
                                        value={formData.mat_horas_practica || 0}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Laboratorio</label>
                                    <input
                                        type="number"
                                        name="mat_horas_lab"
                                        value={formData.mat_horas_lab || 0}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Est. Independiente</label>
                                    <input
                                        type="number"
                                        name="mat_horas_est_indep"
                                        value={formData.mat_horas_est_indep || 0}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Checkbox Requisito */}
                        <div className="sm:col-span-2 flex items-center mt-2">
                            <input
                                id="mat_is_requirement"
                                name="mat_is_requirement"
                                type="checkbox"
                                checked={formData.mat_is_requirement || false}
                                onChange={handleChange}
                                className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                            />
                            <label htmlFor="mat_is_requirement" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                ¿Es materia requisito?
                            </label>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="materia-form"
                        disabled={loading}
                        className="px-4 py-2 flex items-center gap-2 text-sm font-semibold text-white bg-primary border border-transparent rounded-lg hover:bg-primary/90 focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                Guardar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
