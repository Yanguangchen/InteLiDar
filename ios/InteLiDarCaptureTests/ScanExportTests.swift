import XCTest
import simd
@testable import InteLiDarCapture

final class ScanExportTests: XCTestCase {
    func testExportNormalizesOriginAndGivesPlanarOpeningThickness() throws {
        var matrix = matrix_identity_float4x4
        matrix.columns.3 = SIMD4<Float>(4, 2, -3, 1)
        let object = ExportObject(id: "rp:test", type: "window", label: "Window", category: "opening",
                                  dimensions: SIMD3<Float>(2, 1, 0), transform: matrix, origin: SIMD3<Float>(3, 0.5, -4),
                                  material: "glass", color: "#7ec8e3")
        XCTAssertEqual(object.position, [1, 1.5, 1])
        XCTAssertEqual(object.size, [2, 1, 0.01])
        XCTAssertEqual(object.rotation, [0, 0, 0])
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: JSONEncoder().encode(object)) as? [String: Any])
        XCTAssertEqual(json["id"] as? String, "rp:test")
        XCTAssertEqual(json["category"] as? String, "opening")
    }

    func testXYZAnglesRoundTripCompoundAndGimbalLockRotations() {
        let angles: [SIMD3<Float>] = [SIMD3(0.2, 0.6, -0.3), SIMD3(0, .pi / 2, 0), SIMD3(0.3, -.pi / 2, 0.4), SIMD3(0, .pi, 0)]
        for angles in angles {
            let original = rotationMatrix(angles)
            let euler = xyzEuler(original)
            let result = rotationMatrix(SIMD3(euler[0], euler[1], euler[2]))
            for column in 0..<3 {
                for row in 0..<3 { XCTAssertEqual(result[column][row], original[column][row], accuracy: 0.0001) }
            }
        }
    }

    private func rotationMatrix(_ angles: SIMD3<Float>) -> simd_float4x4 {
        let x = simd_float4x4(simd_quatf(angle: angles.x, axis: SIMD3(1, 0, 0)))
        let y = simd_float4x4(simd_quatf(angle: angles.y, axis: SIMD3(0, 1, 0)))
        let z = simd_float4x4(simd_quatf(angle: angles.z, axis: SIMD3(0, 0, 1)))
        return x * y * z
    }
}
