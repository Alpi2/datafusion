"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit3,
  Database,
  Type,
  Calendar,
  Hash,
  ToggleLeft,
  FileText,
  Download,
  Eye,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GenerationTier } from "./GenerationInterface";

interface SchemaBuilderProps {
  tier: GenerationTier;
}

interface SchemaField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description: string;
  constraints?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
    format?: string;
  };
  examples?: string[];
}

export function SchemaBuilder({ tier }: SchemaBuilderProps) {
  const [fields, setFields] = useState<SchemaField[]>([
    {
      id: "1",
      name: "user_id",
      type: "integer",
      required: true,
      description: "Unique identifier for each user",
      constraints: { min: 1, max: 999999 },
      examples: ["1", "2543", "89234"],
    },
    {
      id: "2",
      name: "email",
      type: "email",
      required: true,
      description: "User email address",
      constraints: {
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      },
      examples: ["john.doe@example.com", "alice.smith@company.org"],
    },
  ]);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const dataTypes = [
    { id: "string", name: "Text", icon: Type, description: "Any text value" },
    {
      id: "integer",
      name: "Integer",
      icon: Hash,
      description: "Whole numbers",
    },
    {
      id: "float",
      name: "Decimal",
      icon: Hash,
      description: "Decimal numbers",
    },
    {
      id: "boolean",
      name: "Boolean",
      icon: ToggleLeft,
      description: "True/false values",
    },
    { id: "date", name: "Date", icon: Calendar, description: "Date values" },
    {
      id: "datetime",
      name: "DateTime",
      icon: Calendar,
      description: "Date and time values",
    },
    { id: "email", name: "Email", icon: Type, description: "Email addresses" },
    { id: "phone", name: "Phone", icon: Type, description: "Phone numbers" },
    { id: "url", name: "URL", icon: Type, description: "Web addresses" },
    { id: "uuid", name: "UUID", icon: Hash, description: "Unique identifiers" },
  ];

  const addField = () => {
    const newField: SchemaField = {
      id: Date.now().toString(),
      name: "new_field",
      type: "string",
      required: false,
      description: "Description for new field",
      examples: ["example1", "example2"],
    };
    setFields([...fields, newField]);
    setEditingField(newField.id);
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
  };

  const updateField = (fieldId: string, updates: Partial<SchemaField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const getTypeIcon = (type: string) => {
    const typeData = dataTypes.find((dt) => dt.id === type);
    return typeData?.icon || Type;
  };

  const getFieldCount = () => {
    const limits = {
      basic: 10,
      workflow: 50,
      production: "Unlimited",
    };
    return limits[tier];
  };

  const canAddField = () => {
    if (tier === "production") return true;
    const limit = tier === "basic" ? 10 : 50;
    return fields.length < limit;
  };

  const sampleData = fields.slice(0, 3).map((field, index) => {
    const values = {
      string: [`Sample text ${index + 1}`, `Another value ${index + 1}`],
      integer: [
        Math.floor(Math.random() * 1000),
        Math.floor(Math.random() * 1000),
      ],
      email: [`user${index + 1}@example.com`, `test${index + 1}@domain.org`],
      boolean: [true, false],
      date: ["2024-01-15", "2024-03-22"],
      float: [
        (Math.random() * 100).toFixed(2),
        (Math.random() * 100).toFixed(2),
      ],
    };
    return (
      values[field.type as keyof typeof values] || [
        `value${index + 1}`,
        `value${index + 2}`,
      ]
    );
  });

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Schema Builder
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Define the structure and constraints for your synthetic dataset
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-indigo-300 border-indigo-500/30"
          >
            {fields.length}/{getFieldCount()} fields
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "Hide" : "Preview"}
          </Button>
        </div>
      </div>

      {/* Schema Fields */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">Fields Definition</h4>
          <Button
            onClick={addField}
            disabled={!canAddField()}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>

        <AnimatePresence>
          {fields.map((field, index) => {
            const TypeIcon = getTypeIcon(field.type);
            const isEditing = editingField === field.id;

            return (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`border rounded-lg p-4 ${
                  isEditing
                    ? "border-indigo-500 bg-indigo-500/5"
                    : "border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-slate-400 block mb-1">
                              Field Name
                            </label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) =>
                                updateField(field.id, { name: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-400 block mb-1">
                              Data Type
                            </label>
                            <select
                              value={field.type}
                              onChange={(e) =>
                                updateField(field.id, { type: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {dataTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-400 block mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={field.description}
                            onChange={(e) =>
                              updateField(field.id, {
                                description: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                updateField(field.id, {
                                  required: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500"
                            />
                            Required field
                          </label>
                          <Button
                            onClick={() => setEditingField(null)}
                            size="sm"
                            variant="outline"
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center">
                          <TypeIcon className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-white">
                              {field.name}
                            </h5>
                            <Badge variant="outline" className="text-xs">
                              {dataTypes.find((t) => t.id === field.type)?.name}
                            </Badge>
                            {field.required && (
                              <Badge
                                variant="outline"
                                className="text-xs text-red-300 border-red-500/30"
                              >
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">
                            {field.description}
                          </p>
                          {field.examples && (
                            <div className="flex gap-1 mt-1">
                              {field.examples.slice(0, 2).map((example, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs bg-slate-700/50 text-slate-300"
                                >
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingField(field.id)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(field.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!canAddField() && (
          <div className="text-center py-4 border border-slate-700 rounded-lg bg-slate-800/20">
            <p className="text-sm text-slate-400">
              Field limit reached for {tier} tier.
              <Button variant="link" className="text-indigo-400 p-0 ml-1">
                Upgrade to add more fields
              </Button>
            </p>
          </div>
        )}
      </div>

      {/* Schema Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/30 rounded-lg p-4 mb-6"
          >
            <h4 className="font-medium text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Data Preview
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {fields.slice(0, 5).map((field) => (
                      <th
                        key={field.id}
                        className="text-left py-2 px-3 text-slate-300 font-medium"
                      >
                        {field.name}
                        {field.required && (
                          <span className="text-red-400 ml-1">*</span>
                        )}
                      </th>
                    ))}
                    {fields.length > 5 && (
                      <th className="text-left py-2 px-3 text-slate-400">
                        +{fields.length - 5} more...
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[0, 1].map((rowIndex) => (
                    <tr key={rowIndex} className="border-b border-slate-700/50">
                      {fields.slice(0, 5).map((field, fieldIndex) => (
                        <td key={field.id} className="py-2 px-3 text-slate-300">
                          {sampleData[fieldIndex]?.[rowIndex] || "sample"}
                        </td>
                      ))}
                      {fields.length > 5 && (
                        <td className="py-2 px-3 text-slate-400">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schema Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Settings className="w-4 h-4" />
          Schema validation:{" "}
          {tier === "basic"
            ? "Basic"
            : tier === "workflow"
            ? "Advanced"
            : "Enterprise"}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Schema
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            Save Schema
          </Button>
        </div>
      </div>
    </div>
  );
}
