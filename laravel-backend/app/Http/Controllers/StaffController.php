<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    private function formatBooking($booking)
    {
        return [
            'booking_id' => $booking->booking_id,
            'event_date' => $booking->event_date,
            'event_time' => substr($booking->event_time, 0, 5),
            'guest_count' => $booking->guest_count,
            'venue' => $booking->venue,
            'special_requests' => $booking->special_requests,
            'quoted_total' => number_format((float)$booking->quoted_total, 2, '.', ''),
            'status' => $booking->status,
            'created_at' => $booking->created_at ? $booking->created_at->toDateTimeString() : null,
            'package_name' => $booking->package ? $booking->package->name : null,
            'full_name' => $booking->customer ? $booking->customer->full_name : null,
            'email' => $booking->customer ? $booking->customer->email : null,
            'payment_status' => $booking->payment ? $booking->payment->status : null,
        ];
    }

    public function index()
    {
        $bookings = Booking::with(['package', 'customer', 'payment'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderBy('event_date', 'asc')
            ->orderBy('booking_id', 'desc')
            ->get();

        return response()->json($bookings->map(fn($b) => $this->formatBooking($b)));
    }

    public function updateStatus(Request $request, $id)
    {
        $status = $request->input('status');
        $allowed = ['pending', 'confirmed', 'in_preparation', 'completed', 'cancelled'];

        if (!in_array($status, $allowed)) {
            return response()->json(['error' => 'Invalid booking or status.'], 400);
        }

        $booking = Booking::find($id);
        if (!$booking) {
            return response()->json(['error' => 'Booking not found.'], 404);
        }

        $booking->status = $status;
        $booking->save();

        return response()->json(['message' => 'Booking status updated.']);
    }

    public function pay(Request $request, $id)
    {
        $booking = Booking::find($id);
        if (!$booking) {
            return response()->json(['error' => 'Booking not found.'], 404);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['error' => 'Cannot record payment for a cancelled booking.'], 400);
        }

        $existing = Payment::where('booking_id', $id)->where('status', 'paid')->exists();
        if ($existing) {
            return response()->json(['error' => 'This booking has already been paid.'], 400);
        }

        Payment::create([
            'booking_id' => $id,
            'amount' => $booking->quoted_total,
            'payment_method' => 'Cash',
            'status' => 'paid',
            'paid_at' => now()
        ]);

        return response()->json(['message' => 'Payment recorded successfully.']);
    }
}