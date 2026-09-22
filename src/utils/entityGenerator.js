/**
 * JSON to Java Entity & TypeScript Interface Generator (100% Client-Side)
 */

// Helper to convert snake_case or kebab-case to camelCase
export function toCamelCase(str) {
  return str
    .replace(/[-_]([a-z0-9])/gi, (_, char) => char.toUpperCase())
    .replace(/^([A-Z])/, char => char.toLowerCase());
}

// Helper to convert to PascalCase (for class/interface names)
export function toPascalCase(str) {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// Infer Java Type from value
function inferJavaType(val, fieldName) {
  if (val === null || val === undefined) return 'Object';
  if (typeof val === 'boolean') return 'Boolean';
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return Math.abs(val) > 2147483647 ? 'Long' : 'Integer';
    }
    return 'BigDecimal';
  }
  if (typeof val === 'string') {
    // Check if ISO date
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) return 'LocalDateTime';
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return 'LocalDate';
    return 'String';
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return 'List<Object>';
    const itemType = inferJavaType(val[0], fieldName);
    return `List<${itemType}>`;
  }
  if (typeof val === 'object') {
    return toPascalCase(fieldName) + 'DTO';
  }
  return 'Object';
}

// Infer TypeScript Type from value
function inferTsType(val, fieldName) {
  if (val === null || val === undefined) return 'any';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'string') return 'string';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'any[]';
    const itemType = inferTsType(val[0], fieldName);
    return `${itemType}[]`;
  }
  if (typeof val === 'object') {
    return toPascalCase(fieldName) + 'Item';
  }
  return 'any';
}

// Parse input JSON safely
export function parseJson(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('请输入有效的 JSON 文本');
  }
  let parsed = JSON.parse(rawText.trim());
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) throw new Error('输入的 JSON 数组为空');
    parsed = parsed[0]; // analyze the first object structure
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('JSON 顶层必须是一个对象或对象数组');
  }
  return parsed;
}

// Generate Java Class
export function generateJavaEntity(jsonObj, className = 'DemoDTO', options = {}) {
  const {
    useLombok = true,
    useJackson = true,
    useBigDecimal = true,
    packageName = 'com.example.dto'
  } = options;

  const lines = [];
  lines.push(`package ${packageName};\n`);

  // Imports
  const imports = new Set();
  if (useLombok) {
    imports.add('import lombok.Data;');
    imports.add('import lombok.Builder;');
    imports.add('import lombok.NoArgsConstructor;');
    imports.add('import lombok.AllArgsConstructor;');
  }
  if (useJackson) {
    imports.add('import com.fasterxml.jackson.annotation.JsonProperty;');
  }
  imports.add('import java.io.Serializable;');

  const fieldEntries = Object.entries(jsonObj);
  const childClasses = [];

  // Check types for imports
  for (const [key, val] of fieldEntries) {
    const javaType = inferJavaType(val, key);
    if (javaType.includes('List<')) imports.add('import java.util.List;');
    if (javaType === 'BigDecimal' || (useBigDecimal && typeof val === 'number' && !Number.isInteger(val))) {
      imports.add('import java.math.BigDecimal;');
    }
    if (javaType === 'LocalDateTime') imports.add('import java.time.LocalDateTime;');
    if (javaType === 'LocalDate') imports.add('import java.time.LocalDate;');

    // Handle nested objects
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      childClasses.push({ name: javaType, obj: val });
    } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      childClasses.push({ name: toPascalCase(key) + 'DTO', obj: val[0] });
    }
  }

  lines.push(Array.from(imports).sort().join('\n'));
  lines.push('');

  // Class annotations
  if (useLombok) {
    lines.push('@Data');
    lines.push('@Builder');
    lines.push('@NoArgsConstructor');
    lines.push('@AllArgsConstructor');
  }
  lines.push(`public class ${className} implements Serializable {`);
  lines.push('    private static final long serialVersionUID = 1L;\n');

  // Fields
  for (const [key, val] of fieldEntries) {
    const camelField = toCamelCase(key);
    let type = inferJavaType(val, key);

    if (useJackson && key !== camelField) {
      lines.push(`    @JsonProperty("${key}")`);
    }
    lines.push(`    private ${type} ${camelField};\n`);
  }

  lines.push('}');

  // Append nested classes if any
  for (const child of childClasses) {
    lines.push('\n' + generateJavaEntity(child.obj, child.name, { ...options, packageName: '' }).replace(/^package .*;\n+/g, ''));
  }

  return lines.join('\n');
}

// Generate TypeScript Interface
export function generateTsInterface(jsonObj, interfaceName = 'DemoData') {
  const lines = [];
  const childInterfaces = [];

  lines.push(`export interface ${interfaceName} {`);

  for (const [key, val] of Object.entries(jsonObj)) {
    const tsType = inferTsType(val, key);
    const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
    const formattedKey = validIdentifier ? key : `'${key}'`;

    lines.push(`  ${formattedKey}?: ${tsType};`);

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      childInterfaces.push({ name: tsType, obj: val });
    } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      childInterfaces.push({ name: toPascalCase(key) + 'Item', obj: val[0] });
    }
  }

  lines.push('}');

  for (const child of childInterfaces) {
    lines.push('\n' + generateTsInterface(child.obj, child.name));
  }

  return lines.join('\n');
}
