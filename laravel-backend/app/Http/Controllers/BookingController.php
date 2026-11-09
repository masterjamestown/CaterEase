<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Package;
use App\Models\Payment;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    private function formatBooking($booking)
    {
        return [
            'booking_id'       => $booking->booking_id,
            'event_date'       => $booking->event_date,
            'event_time'       => substr($booking->event_time, 0, 5),
            'guest_count'      => $booking->guest_count,
            'venue'            => $booking->venue,
            'contact_number'   => $booking->contact_number,
            'special_requests' => $booking->special_requests,
            'quoted_total'     => number_format((float) $booking->quoted_total, 2, '.', ''),
            'status'           => $booking->status,
            'created_at'       => $booking->created_at
                ? $booking->created_at->toDateTimeString()
                : null,
            'package_name'     => $booking->package ? $booking->package->name : null,
            'full_name'        => $booking->customer ? $booking->customer->full_name : null,
            'email'            => $booking->customer ? $booking->customer->email : null,
            'payment_status'   => $booking->payment ? $booking->payment->status : null,
            'payment_method'   => $booking->payment ? $booking->payment->payment_method : null,
        ];
    }

    public function store(Request $request)
    {
        $packageId     = (int) $request->input('package_id');
        $guestCount    = (int) $request->input('guest_count');
        $eventDate     = trim($request->input('event_date', ''));
        $eventTime     = trim($request->input('event_time', ''));
        $venue         = trim($request->input('venue', ''));
        $contactNumber = trim($request->input('contact_number', ''));
        $requests      = trim($request->input('special_requests', ''));

        if (
            !$packageId
            || $guestCount < 1
            || $guestCount > 100000
            || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $eventDate)
            || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $eventTime)
            || strlen($venue) < 3
            || strlen($venue) > 255
            || strlen($contactNumber) < 7
            || strlen($contactNumber) > 20
            || strlen($requests) > 1000
        ) {
            return response()->json(['error' => 'Please provide valid event details.'], 400);
        }

        $today = date('Y-m-d');
        if ($eventDate < $today) {
            return response()->json(['error' => 'The event date cannot be in the past.'], 400);
        }

        $package = Package::where('package_id', $packageId)
            ->where('is_active', 1)
            ->first();

        if (!$package) {
            return response()->json(['error' => 'This package is not available.'], 404);
        }

        if ($guestCount < $package->minimum_guests) {
            return response()->json(
                ['error' => 'This package needs at least ' . $package->minimum_guests . ' guests.'],
                400
            );
        }

        $userId = $request->user()->user_id;

        $existing = Booking::where('customer_id', $userId)
            ->where('event_date', $eventDate)
            ->exists();

        if ($existing) {
            return response()->json(
                ['error' => 'You already have a booking request on this date.'],
                400
            );
        }

        $pendingCount = Booking::where('customer_id', $userId)
            ->where('status', 'pending')
            ->count();

        if ($pendingCount >= 3) {
            return response()->json(
                ['error' => 'You have 3 pending bookings. Please wait for staff to review them before booking again.'],
                400
            );
        }

        $baseTotal  = $package->price_per_guest * $guestCount;
        $dayOfWeek  = date('w', strtotime($eventDate));
        $isWeekend  = ($dayOfWeek == 0 || $dayOfWeek == 6);
        $surcharge  = $isWeekend ? $baseTotal * 0.15 : 0;
        $quotedTotal = number_format($baseTotal + $surcharge, 2, '.', '');

        $booking = Booking::create([
            'customer_id'      => $userId,
            'package_id'       => $packageId,
            'event_date'       => $eventDate,
            'event_time'       => $eventTime . ':00',
            'guest_count'      => $guestCount,
            'venue'            => $venue,
            'contact_number'   => $contactNumber,
            'special_requests' => $requests ?: null,
            'quoted_total'     => $quotedTotal,
            'status'           => 'pending',
        ]);

        return response()->json(
            ['booking_id' => $booking->booking_id, 'status' => 'pending'],
            201
        );
    }

    public function mine(Request $request)
    {
        $userId = $request->user()->user_id;

        $bookings = Booking::with(['package', 'customer', 'payment'])
            ->where('customer_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($bookings->map(fn ($b) => $this->formatBooking($b)));
    }

    public function cancel(Request $request, $id)
    {
        $booking = Booking::find($id);

        if (!$booking) {
            return response()->json(['error' => 'Booking not found.'], 404);
        }
        if ($booking->customer_id !== $request->user()->user_id) {
            return response()->json(['error' => 'You can only cancel your own bookings.'], 403);
        }
        if (!in_array($booking->status, ['pending', 'confirmed'])) {
            return response()->json(['error' => 'This booking can no longer be cancelled.'], 400);
        }

        $booking->status = 'cancelled';
        $booking->save();

        return response()->json(['message' => 'Booking cancelled successfully.']);
    }

    public function payOnline(Request $request, $id)
    {
        $booking = Booking::find($id);

        if (!$booking) {
            return response()->json(['error' => 'Booking not found.'], 404);
        }
        if ($booking->customer_id !== $request->user()->user_id) {
            return response()->json(['error' => 'You can only pay for your own bookings.'], 403);
        }
        if (!in_array($booking->status, ['pending', 'confirmed'])) {
            return response()->json(['error' => 'This booking cannot be paid online.'], 400);
        }

        $existingPayment = Payment::where('booking_id', $id)
            ->where('status', 'paid')
            ->first();

        if ($existingPayment) {
            return response()->json(['error' => 'This booking has already been paid.'], 400);
        }

        Payment::create([
            'booking_id'     => $id,
            'amount'         => $booking->quoted_total,
            'payment_method' => 'Online',
            'status'         => 'paid',
            'paid_at'        => now(),
        ]);

        $booking->status = 'confirmed';
        $booking->save();

        return response()->json(['message' => 'Payment successful. Booking confirmed.']);
    }
}