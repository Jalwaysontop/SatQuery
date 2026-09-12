"""
text_guided_grounding wiring, exercised through the real API. The actual
Qwen2.5-VL-3B + grounding LoRA model requires a CUDA GPU (see
satquery_grounding_inference.py) and is out of scope for CI, so
`run_grounding` is monkeypatched at the boundary the same way `run_qwen_vqa`
is mocked in test_vqa_qwen_backend.py — everything above that boundary
(classifier, controller, tool, response shaping) runs for real.
"""


def test_text_guided_grounding_returns_boxes(client, monkeypatch, sample_t1_files):
    monkeypatch.setattr(
        "app.tools.grounding_tool.run_grounding",
        lambda image, query: {
            "boxes": [[10, 20, 110, 220]],
            "num_boxes": 1,
            "latency_ms": 5.0,
            "annotated_image_base64": None,
        },
    )

    files = [("optical_t1_files", (name, content, "image/tiff")) for name, content in sample_t1_files.items()]

    resp = client.post(
        "/api/v1/analyze",
        data={"query": "Find all vehicles."},
        files=files,
    )

    assert resp.status_code == 200
    body = resp.json()

    assert body["task"] == "text_guided_grounding"
    assert body["regions"] is None
    assert body["grounded_regions"] == [
        {"region_id": 0, "bbox_px": [10, 20, 100, 200], "centroid_px": [60.0, 120.0]}
    ]
    assert body["execution_summary"]["parameters"]["num_boxes"] == 1
    assert body["execution_summary"]["warnings"] == []


def test_text_guided_grounding_with_no_boxes_warns(client, monkeypatch, sample_t1_files):
    monkeypatch.setattr(
        "app.tools.grounding_tool.run_grounding",
        lambda image, query: {
            "boxes": [],
            "num_boxes": 0,
            "latency_ms": 5.0,
            "annotated_image_base64": None,
        },
    )

    files = [("optical_t1_files", (name, content, "image/tiff")) for name, content in sample_t1_files.items()]

    resp = client.post(
        "/api/v1/analyze",
        data={"query": "Locate all ships."},
        files=files,
    )

    assert resp.status_code == 200
    body = resp.json()

    assert body["grounded_regions"] is None
    assert body["execution_summary"]["warnings"] == [
        "No objects matching the query were localized in this image."
    ]
