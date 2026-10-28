"use client";

import React, { useState, useEffect, useRef } from "react";
import { EquipmentItem, EquipmentStatus } from "@/types";
import {
  X,
  Check,
  AlertCircle,
  Sparkles,
  Camera,
  ShieldAlert,
  Upload,
  LinkIcon,
  FolderOpen,
  ImageIcon,
  Trash2,
} from "@/components/icons";

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentToEdit?: EquipmentItem | null;
  categories: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export function EquipmentFormModal({
  isOpen,
  onClose,
  equipmentToEdit,
  categories,
  onSuccess,
}: EquipmentFormModalProps) {
  const isEditing = Boolean(equipmentToEdit);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    brand: "",
    model: "",
    serialNumber: "",
    categoryId: "",
    totalUnits: 1,
    status: "AVAILABLE" as EquipmentStatus,
    replacementValue: 0,
    description: "",
    accessoriesSummary: "",
    requiresSpecialApproval: false,
    staffOnly: false,
    imageUrl: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para manejo de fotografía (Subir archivo o URL)
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (equipmentToEdit) {
      setFormData({
        name: equipmentToEdit.name || "",
        code: equipmentToEdit.code || "",
        brand: equipmentToEdit.brand || "",
        model: equipmentToEdit.model || "",
        serialNumber: equipmentToEdit.serialNumber || "",
        categoryId: equipmentToEdit.categoryId || categories[0]?.id || "",
        totalUnits: equipmentToEdit.totalUnits || 1,
        status: equipmentToEdit.status || "AVAILABLE",
        replacementValue: equipmentToEdit.replacementValue || 0,
        description: equipmentToEdit.description || "",
        accessoriesSummary: equipmentToEdit.accessoriesSummary || "",
        requiresSpecialApproval: Boolean(equipmentToEdit.requiresSpecialApproval),
        staffOnly: Boolean(equipmentToEdit.staffOnly),
        imageUrl: equipmentToEdit.imageUrl || "",
        notes: equipmentToEdit.notes || "",
      });

      if (equipmentToEdit.imageUrl) {
        if (
          equipmentToEdit.imageUrl.startsWith("http://") ||
          equipmentToEdit.imageUrl.startsWith("https://")
        ) {
          setImageMode("url");
        } else {
          setImageMode("upload");
        }
      } else {
        setImageMode("upload");
      }
    } else {
      setFormData({
        name: "",
        code: "",
        brand: "",
        model: "",
        serialNumber: "",
        categoryId: categories[0]?.id || "",
        totalUnits: 1,
        status: "AVAILABLE",
        replacementValue: 0,
        description: "",
        accessoriesSummary: "",
        requiresSpecialApproval: false,
        staffOnly: false,
        imageUrl: "",
        notes: "",
      });
      setImageMode("upload");
    }
    setError(null);
    setUploadError(null);
  }, [equipmentToEdit, categories, isOpen]);

  const handleFileUpload = async (file: File) => {
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Por favor seleccione un archivo de imagen válido (JPG, PNG, WEBP, GIF, etc.).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("El archivo no debe superar los 10 MB.");
      return;
    }

    setUploadingImage(true);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al subir la imagen al servidor.");
      }

      setFormData((prev) => ({ ...prev, imageUrl: result.url }));
    } catch (err: any) {
      setUploadError(err.message || "Error al procesar la subida del archivo al servidor.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.code.trim() || !formData.brand.trim() || !formData.model.trim()) {
      setError("Por favor complete los campos obligatorios (Nombre, Código, Marca y Modelo).");
      return;
    }

    if (!formData.description.trim() || formData.description.length < 5) {
      setError("La descripción técnica debe contener al menos 5 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const url = "/api/equipments";
      const method = isEditing ? "PATCH" : "POST";
      const payload = isEditing ? { id: equipmentToEdit?.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al guardar el equipamiento");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? `Editar Equipamiento: ${equipmentToEdit?.code}` : "Alta de Nuevo Equipamiento"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Modifique los datos técnicos, stock y parámetros de reserva del equipo."
                  : "Complete la ficha para incorporar un nuevo recurso al catálogo de la UNLa."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700">Nombre del equipo *</label>
              <input
                type="text"
                required
                placeholder="ej. Sony FX3 Cinema Line Full-Frame"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Código Interno */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Código interno (identificador) *</label>
              <input
                type="text"
                required
                placeholder="ej. CAM-007"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Categoría */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Categoría *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Marca */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Marca *</label>
              <input
                type="text"
                required
                placeholder="ej. Sony, Canon, Rode, Manfrotto"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Modelo */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Modelo *</label>
              <input
                type="text"
                required
                placeholder="ej. FX3, Wireless GO II, SL60W"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* N° Serie */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Número de serie</label>
              <input
                type="text"
                placeholder="ej. SN-2026-9938"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Stock de unidades */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Stock total de unidades *</label>
              <input
                type="number"
                min={1}
                required
                value={formData.totalUnits}
                onChange={(e) => setFormData({ ...formData, totalUnits: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Estado Técnico */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Estado técnico *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs bg-white"
              >
                <option value="AVAILABLE">Disponible para préstamo</option>
                <option value="IN_LOAN">En préstamo</option>
                <option value="MAINTENANCE">En mantenimiento técnico (no reservable)</option>
                <option value="OUT_OF_SERVICE">Fuera de servicio (baja provisoria)</option>
              </select>
            </div>

            {/* Valor de Reposición */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Valor est. reposición (USD)</label>
              <input
                type="number"
                min={0}
                placeholder="ej. 3500"
                value={formData.replacementValue}
                onChange={(e) => setFormData({ ...formData, replacementValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Descripción Técnica */}
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700">Descripción y características *</label>
              <textarea
                rows={2}
                required
                placeholder="Breve descripción del equipo, capacidades y recomendaciones de uso institucional..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Accesorios incluidos */}
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700">Accesorios incluidos en el maletín</label>
              <input
                type="text"
                placeholder="ej. 2 baterías, cargador dual, cable USB-C, valija rígida estanca"
                value={formData.accessoriesSummary}
                onChange={(e) => setFormData({ ...formData, accessoriesSummary: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Fotografía del equipamiento (Subir archivo mediante Explorer o URL) */}
            <div className="sm:col-span-2 space-y-2.5 p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    Fotografía del equipamiento
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Podés subir un archivo desde tu computadora o vincular un enlace URL web.
                  </p>
                </div>

                {/* Alternador de Modo: Explorador vs URL */}
                <div className="inline-flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setImageMode("upload");
                      setUploadError(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-semibold text-[11px] ${
                      imageMode === "upload"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Subir desde PC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageMode("url");
                      setUploadError(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-semibold text-[11px] ${
                      imageMode === "url"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Enlace URL</span>
                  </button>
                </div>
              </div>

              {/* Mensaje de error de carga */}
              {uploadError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Vista previa de imagen actual si está cargada */}
              {formData.imageUrl && (
                <div className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                    <img
                      src={formData.imageUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-800 truncate">
                        {formData.imageUrl.startsWith("/uploads/") || formData.imageUrl.startsWith("data:image/")
                          ? "Imagen alojada en el servidor"
                          : "Imagen vinculada por URL web"}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          formData.imageUrl.startsWith("/uploads/") || formData.imageUrl.startsWith("data:image/")
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {formData.imageUrl.startsWith("/uploads/") || formData.imageUrl.startsWith("data:image/")
                          ? "Servidor Local"
                          : "Web Externa"}
                      </span>
                    </div>
                    <p
                      className="text-[10px] text-slate-400 font-mono truncate mt-0.5"
                      title={formData.imageUrl.startsWith("data:image/") ? "Imagen embebida en base de datos" : formData.imageUrl}
                    >
                      {formData.imageUrl.startsWith("data:image/")
                        ? "Imagen guardada directamente en la base de datos"
                        : formData.imageUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {imageMode === "upload" && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                      >
                        Cambiar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, imageUrl: "" });
                        setUploadError(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Quitar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Modo A: Subida mediante explorador de archivos */}
              {imageMode === "upload" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                      isDragging
                        ? "border-indigo-500 bg-indigo-50/60"
                        : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20 bg-white"
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center py-2 space-y-2">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-semibold text-indigo-700">
                          Subiendo y guardando archivo en el servidor...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Hacé clic para seleccionar desde tu computadora
                          </p>
                          <p className="text-[11px] text-slate-500">
                            o arrastrá y soltá una foto aquí para subirla al servidor
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                          <span>Formatos: JPG, PNG, WEBP, GIF, SVG</span>
                          <span>•</span>
                          <span>Máx. 10 MB</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Modo B: Enlace URL web directa */
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/fotos/camara.jpg o enlace Unsplash"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value });
                        setUploadError(null);
                      }}
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs bg-white"
                    />
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: "" })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        title="Borrar URL"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ingresá una URL pública directa a la imagen del equipamiento.
                  </p>
                </div>
              )}
            </div>

            {/* Políticas de Aprobación */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 space-y-2">
              <span className="font-bold text-slate-700 block">Restricciones y políticas de préstamo:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresSpecialApproval}
                    onChange={(e) => setFormData({ ...formData, requiresSpecialApproval: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Requiere aprobación especial</span>
                    <span className="text-[10px] text-slate-500">Debe ser avalado puntualmente por la Secretaría.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.staffOnly}
                    onChange={(e) => setFormData({ ...formData, staffOnly: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Exclusivo Docente / Nodocente</span>
                    <span className="text-[10px] text-slate-500">Inhabilitado para reservas directas de estudiantes.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? "Guardar Cambios" : "Crear Equipamiento"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
