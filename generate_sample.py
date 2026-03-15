"""
Sample NGSIM Data Generator
Generates realistic synthetic NGSIM trajectory data for testing the system.
Produces data that contains all three scenario types.
"""

import numpy as np
import pandas as pd
import config


def generate_sample_ngsim(output_path: str, num_vehicles: int = 60, duration_sec: int = 120):
    """
    Generate synthetic NGSIM-format data with embedded scenarios.

    Creates a dataset simulating traffic on a 5-lane highway segment (US-101 style)
    with ~60 vehicles over 120 seconds at 10 Hz.
    """
    print(f"  Generating sample NGSIM data: {num_vehicles} vehicles, {duration_sec}s duration...")

    fps = config.SAMPLING_RATE_HZ
    total_frames = duration_sec * fps
    base_time = 1118847000000  # Approximate NGSIM epoch time (ms)

    records = []
    vehicle_id = 1

    # Group 1: Car-following pairs (vehicles following each other in same lane)
    for pair in range(8):
        lane = (pair % 5) + 1
        base_y = 200.0 + pair * 50
        base_x = 6.0 * lane

        # Lead vehicle
        lead_id = vehicle_id
        vehicle_id += 1
        lead_speed = 35.0 + np.random.uniform(-5, 5)
        start_frame = pair * 100

        for f in range(total_frames):
            frame = start_frame + f
            t = f / fps
            speed = lead_speed + np.sin(t * 0.3) * 3.0
            acc = np.cos(t * 0.3) * 0.9
            y_pos = base_y + speed * t
            records.append([
                lead_id, frame, total_frames,
                base_time + frame * 100,
                base_x, y_pos, base_x + 6000000, y_pos + 1600000,
                14.5, 6.0, 2,
                speed, acc, lane,
                0, 0,
                0.0, 0.0
            ])

        # Following vehicle
        follower_id = vehicle_id
        vehicle_id += 1
        headway = 50.0 + np.random.uniform(10, 80)

        for f in range(total_frames):
            frame = start_frame + f
            t = f / fps
            speed = lead_speed + np.sin(t * 0.3 + 0.2) * 3.5
            acc = np.cos(t * 0.3 + 0.2) * 1.0
            y_pos = base_y + speed * t - headway
            records.append([
                follower_id, frame, total_frames,
                base_time + frame * 100,
                base_x, y_pos, base_x + 6000000, y_pos + 1600000,
                14.5, 6.0, 2,
                speed, acc, lane,
                lead_id, 0,
                headway, headway / max(speed, 0.1)
            ])

    # Group 2: Stop-and-go vehicles (decelerate, near-stop, re-accelerate)
    for sg in range(8):
        sg_id = vehicle_id
        vehicle_id += 1
        lane = (sg % 5) + 1
        base_x = 6.0 * lane
        base_y = 800.0 + sg * 30
        start_frame = sg * 80

        for f in range(total_frames):
            frame = start_frame + f
            t = f / fps

            # Create stop-and-go pattern every ~10 seconds
            cycle = (t % 10.0) / 10.0
            if cycle < 0.3:
                speed = 30.0 - cycle * 90.0  # Decelerate
                acc = -9.0
            elif cycle < 0.5:
                speed = max(3.0, 3.0 + (cycle - 0.3) * 5.0)  # Near stop
                acc = 1.0
            else:
                speed = 3.0 + (cycle - 0.5) * 54.0  # Accelerate
                acc = 5.4
            speed = max(0.5, speed)
            y_pos = base_y + 15.0 * t
            records.append([
                sg_id, frame, total_frames,
                base_time + frame * 100,
                base_x, y_pos, base_x + 6000000, y_pos + 1600000,
                14.5, 6.0, 2,
                speed, acc, lane,
                0, 0,
                0.0, 0.0
            ])

    # Group 3: Lane-changing vehicles
    for lc in range(8):
        lc_id = vehicle_id
        vehicle_id += 1
        source_lane = (lc % 4) + 1
        dest_lane = source_lane + 1
        base_x_src = 6.0 * source_lane
        base_x_dst = 6.0 * dest_lane
        base_y = 500.0 + lc * 40
        start_frame = lc * 90
        speed = 40.0 + np.random.uniform(-5, 10)

        for f in range(total_frames):
            frame = start_frame + f
            t = f / fps

            # Change lane at multiple points during the simulation
            cycle_t = t % 20.0
            if cycle_t < 8.0:
                current_lane = source_lane
                x_pos = base_x_src
            elif cycle_t < 10.0:
                # Transitioning
                frac = (cycle_t - 8.0) / 2.0
                current_lane = dest_lane if frac > 0.5 else source_lane
                x_pos = base_x_src + (base_x_dst - base_x_src) * frac
            else:
                current_lane = dest_lane
                x_pos = base_x_dst

            cur_speed = speed + np.sin(t * 0.5) * 3.0
            acc = np.cos(t * 0.5) * 1.5
            y_pos = base_y + cur_speed * t

            records.append([
                lc_id, frame, total_frames,
                base_time + frame * 100,
                x_pos, y_pos, x_pos + 6000000, y_pos + 1600000,
                14.5, 6.0, 2,
                cur_speed, acc, current_lane,
                0, 0,
                0.0, 0.0
            ])

    # Group 4: Background traffic (steady driving, no special scenario)
    for bg in range(num_vehicles - 24 - 8):
        bg_id = vehicle_id
        vehicle_id += 1
        lane = (bg % 5) + 1
        base_x = 6.0 * lane
        base_y = 100.0 + bg * 25
        speed = 30.0 + np.random.uniform(0, 20)
        start_frame = bg * 50

        for f in range(min(total_frames, 800)):
            frame = start_frame + f
            t = f / fps
            cur_speed = speed + np.sin(t * 0.2) * 2.0
            acc = np.cos(t * 0.2) * 0.4
            y_pos = base_y + cur_speed * t
            records.append([
                bg_id, frame, min(total_frames, 800),
                base_time + frame * 100,
                base_x, y_pos, base_x + 6000000, y_pos + 1600000,
                14.5, 6.0, 2,
                cur_speed, acc, lane,
                0, 0,
                0.0, 0.0
            ])

    df = pd.DataFrame(records, columns=config.NGSIM_COLUMNS)

    # Add preceding/following relationships for car-following pairs
    _add_relationships(df)

    df.to_csv(output_path, index=False)
    print(f"  Sample data generated: {len(df)} records, {df['Vehicle_ID'].nunique()} vehicles")
    print(f"  Saved to: {output_path}")
    return df


def _add_relationships(df):
    """Update Preceding/Following columns based on lane and position proximity."""
    for lane in config.LC_LANE_MAINLINE:
        lane_data = df[df["Lane_ID"] == lane]
        if lane_data.empty:
            continue
        frames = lane_data["Frame_ID"].unique()
        for frame in frames[::50]:  # Process every 50th frame for efficiency
            frame_data = lane_data[lane_data["Frame_ID"] == frame].sort_values("Local_Y", ascending=False)
            if len(frame_data) < 2:
                continue
            vids = frame_data["Vehicle_ID"].values
            for j in range(len(vids) - 1):
                lead = vids[j]
                follower = vids[j + 1]
                mask_follower = (df["Vehicle_ID"] == follower) & (df["Frame_ID"].between(frame - 25, frame + 25))
                df.loc[mask_follower, "Preceding"] = lead
                y_lead = frame_data[frame_data["Vehicle_ID"] == lead]["Local_Y"].values[0]
                y_follower = frame_data[frame_data["Vehicle_ID"] == follower]["Local_Y"].values[0]
                hdwy = abs(y_lead - y_follower)
                df.loc[mask_follower, "Space_Hdwy"] = hdwy


if __name__ == "__main__":
    import os
    os.makedirs("data", exist_ok=True)
    generate_sample_ngsim("data/sample_ngsim.csv")
