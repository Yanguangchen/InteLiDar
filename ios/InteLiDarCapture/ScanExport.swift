import Foundation
import RoomPlan
import simd

struct ScanExport: Encodable {
    let format = "intelidar.roomplan"
    let version = 1
    let source = "roomplan"
    let room: ExportRoom
    let objects: [ExportObject]

    init(room captured: CapturedRoom) throws {
        guard !captured.walls.isEmpty else { throw ExportError.noWalls }
        let namespace = "rp:\(UUID().uuidString.lowercased())"
        var minimum = SIMD3<Float>(repeating: .greatestFiniteMagnitude)
        var maximum = SIMD3<Float>(repeating: -.greatestFiniteMagnitude)
        // RoomPlan's origin is the initial device pose. Normalize all geometry to floor centre.
        func include(_ dimensions: SIMD3<Float>, _ transform: simd_float4x4) {
            for x in [Float(-0.5), Float(0.5)] {
                for y in [Float(-0.5), Float(0.5)] {
                    for z in [Float(-0.5), Float(0.5)] {
                        let p = transform * SIMD4<Float>(dimensions.x * x, dimensions.y * y, dimensions.z * z, 1)
                        let point = SIMD3<Float>(p.x, p.y, p.z)
                        minimum = simd_min(minimum, point)
                        maximum = simd_max(maximum, point)
                    }
                }
            }
        }
        for wall in captured.walls { include(wall.dimensions, wall.transform) }
        for item in captured.objects { include(item.dimensions, item.transform) }
        for surface in captured.doors + captured.windows { include(surface.dimensions, surface.transform) }
        let extent = maximum - minimum
        guard [extent.x, extent.y, extent.z].allSatisfy({ $0.isFinite && $0 > 0 && $0 <= 50 }) else {
            throw ExportError.invalidBounds
        }
        let origin = SIMD3<Float>((minimum.x + maximum.x) / 2, minimum.y, (minimum.z + maximum.z) / 2)
        room = ExportRoom(id: namespace, name: "Captured room", width: extent.x, depth: extent.z, height: extent.y)
        var result: [ExportObject] = captured.objects.map { item in
            let style = Self.style(item.category)
            return ExportObject(id: "\(namespace):\(item.identifier.uuidString.lowercased())", type: style.type,
                                label: style.label, category: style.category, dimensions: item.dimensions,
                                transform: item.transform, origin: origin, material: style.material, color: style.color)
        }
        for surface in captured.doors + captured.windows {
            let isWindow = captured.windows.contains { $0.identifier == surface.identifier }
            result.append(ExportObject(id: "\(namespace):\(surface.identifier.uuidString.lowercased())",
                                       type: isWindow ? "window" : "door", label: isWindow ? "Window" : "Door", category: "opening",
                                       dimensions: surface.dimensions, transform: surface.transform, origin: origin,
                                       material: isWindow ? "glass" : "wood", color: isWindow ? "#7ec8e3" : "#805a3c"))
        }
        guard result.count <= 500 else { throw ExportError.tooManyObjects }
        objects = result
    }

    private static func style(_ category: CapturedRoom.Object.Category) -> (type: String, label: String, category: String, material: String, color: String) {
        switch category {
        case .chair: return ("chair", "Chair", "furniture", "fabric", "#467568")
        case .table: return ("table", "Table", "furniture", "wood", "#b88753")
        case .storage: return ("shelf", "Storage", "furniture", "wood", "#a58a68")
        case .television: return ("monitor", "Television", "equipment", "plastic", "#262b32")
        case .sofa: return ("sofa", "Sofa", "furniture", "fabric", "#7086a3")
        case .bed: return ("bed", "Bed", "furniture", "fabric", "#ded5c4")
        case .stairs: return ("stairs", "Stairs", "structure", "wood", "#a58a68")
        default: return (String(describing: category), String(describing: category).capitalized, "equipment", "plastic", "#c7cbcc")
        }
    }
}

struct ExportRoom: Encodable {
    let id: String
    let name: String
    let width: Float
    let depth: Float
    let height: Float
    let units = "m"
}

struct ExportObject: Encodable {
    let id: String
    let type: String
    let label: String
    let category: String
    let position: [Float]
    let size: [Float]
    let rotation: [Float]
    let material: String
    let color: String

    init(id: String, type: String, label: String, category: String, dimensions: SIMD3<Float>, transform: simd_float4x4,
         origin: SIMD3<Float>, material: String, color: String) {
        self.id = id; self.type = type; self.label = label; self.category = category
        self.material = material; self.color = color
        let p = transform.columns.3
        position = [p.x - origin.x, p.y - origin.y, p.z - origin.z]
        // RoomPlan openings have zero depth; give the rendered frame a small thickness.
        size = [max(0.01, dimensions.x), max(0.01, dimensions.y), max(0.01, dimensions.z)]
        rotation = xyzEuler(transform)
    }
}

/// Same XYZ convention as THREE.Euler.setFromRotationMatrix, including its gimbal-lock branch.
func xyzEuler(_ m: simd_float4x4) -> [Float] {
    let m13 = max(-1, min(1, m.columns.2.x))
    let y = asin(m13)
    if abs(m13) < 0.9999999 {
        return [atan2(-m.columns.2.y, m.columns.2.z), y, atan2(-m.columns.1.x, m.columns.0.x)]
    }
    return [atan2(m.columns.1.z, m.columns.1.y), y, 0]
}

enum ExportError: LocalizedError {
    case noWalls, invalidBounds, tooManyObjects
    var errorDescription: String? {
        switch self {
        case .noWalls: return "No walls were captured. Scan the walls and floor before finishing."
        case .invalidBounds: return "The room bounds are incomplete or exceed 50 metres. Scan one room at a time."
        case .tooManyObjects: return "This scan exceeds 500 objects. Scan a smaller area."
        }
    }
}
